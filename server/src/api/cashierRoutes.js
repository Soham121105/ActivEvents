const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cashierAuthMiddleware = require('../middleware/cashierAuthMiddleware');

// ... (login and check-balance routes remain the same) ...

router.post('/login', async (req, res) => {
  const { cashier_name, pin, event_id } = req.body;
  if (!cashier_name || !pin || !event_id) {
    return res.status(400).json({ error: 'Event, Cashier Name, and PIN are required' });
  }
  try {
    const query = {
      text: `
        SELECT c.*, o.club_name, o.logo_url, o.url_slug, e.event_name
        FROM cashiers c
        JOIN events e ON c.event_id = e.event_id
        JOIN organizers o ON e.organizer_id = o.organizer_id
        WHERE c.cashier_name = $1 AND c.event_id = $2 AND c.is_active = true
      `,
      values: [cashier_name, event_id],
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials for this event' });
    const cashier = result.rows[0];
    const isMatch = await bcrypt.compare(pin, cashier.pin_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const payload = {
      cashier: {
        id: cashier.cashier_id,
        name: cashier.cashier_name,
        event_id: cashier.event_id,
        club_name: cashier.club_name,
        club_logo_url: cashier.logo_url,
        event_name: cashier.event_name,
        url_slug: cashier.url_slug
      }
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token, cashier: payload.cashier });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.use(cashierAuthMiddleware);

router.post('/check-balance', async (req, res) => {
  const { visitor_phone } = req.body;
  const event_id = req.cashier.event_id;
  if (!visitor_phone) return res.status(400).json({ error: 'Phone number is required' });
  try {
    const query = {
      text: "SELECT current_balance FROM wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE'",
      values: [event_id, visitor_phone],
    };
    const { rows: [wallet] } = await pool.query(query);
    if (!wallet) return res.status(200).json({ current_balance: 0 });
    res.status(200).json({ current_balance: wallet.current_balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while checking balance' });
  }
});

// --- UPDATED TOP-UP ROUTE TO FIX PIN_HASH ERROR ---
router.post('/topup', async (req, res) => {
  const { visitor_phone, amount, visitor_name, membership_id } = req.body;
  const cashier_id = req.cashier.id;
  const event_id = req.cashier.event_id;
  
  if (!visitor_phone || !amount) return res.status(400).json({ error: 'Phone and amount are required' });
  if (parseFloat(amount) <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if wallet exists to decide if we need a new PIN
    const checkRes = await client.query(
      'SELECT wallet_id FROM wallets WHERE event_id = $1 AND visitor_phone = $2',
      [event_id, visitor_phone]
    );
    
    let newPin = null;
    let pinHash = null;

    // If no wallet exists, we MUST generate a PIN and its hash.
    if (checkRes.rows.length === 0) {
      newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      pinHash = await bcrypt.hash(newPin, salt);
    }

    // 2. Upsert Wallet
    // We use COALESCE(pin_hash, $6) so if it's an update (conflict), we keep the old hash.
    // If it's a new insert, $6 (pinHash) will be used.
    const walletQuery = {
      text: `
        INSERT INTO wallets (event_id, visitor_phone, current_balance, status, visitor_name, membership_id, pin_hash)
        VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6)
        ON CONFLICT (event_id, visitor_phone)
        DO UPDATE SET
          current_balance = wallets.current_balance + $3,
          status = 'ACTIVE',
          visitor_name = COALESCE($4, wallets.visitor_name),
          membership_id = COALESCE($5, wallets.membership_id)
          -- pin_hash is NOT updated on conflict, preserving the user's existing PIN
        RETURNING wallet_id, current_balance, visitor_phone
      `,
      values: [event_id, visitor_phone, amount, visitor_name || null, membership_id || null, pinHash],
    };
    const { rows: [updatedWallet] } = await client.query(walletQuery);

    // 3. Create Ledger Entry
    await client.query(
      `INSERT INTO cash_ledger (wallet_id, cashier_id, transaction_type, amount) VALUES ($1, $2, 'TOPUP', $3)`,
      [updatedWallet.wallet_id, cashier_id, amount]
    );

    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Top-up successful',
      new_balance: updatedWallet.current_balance,
      visitor_phone: updatedWallet.visitor_phone,
      new_pin: newPin // Will be null if it was an existing wallet, which is correct
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Top-up Error:", err.message); // Improved error logging
    res.status(500).json({ error: 'Server error during top-up' });
  } finally {
    client.release();
  }
});

// ... (refund and log routes remain largely the same, just ensure they are present) ...
router.post('/refund', async (req, res) => {
  const { visitor_phone } = req.body;
  const cashier_id = req.cashier.id;
  const event_id = req.cashier.event_id;
  if (!visitor_phone) return res.status(400).json({ error: 'Phone number is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const getWalletQuery = {
      text: "SELECT * FROM wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE' FOR UPDATE",
      values: [event_id, visitor_phone],
    };
    const { rows: [wallet] } = await client.query(getWalletQuery);
    if (!wallet) return res.status(404).json({ error: 'Active wallet not found' });
    const refundAmount = parseFloat(wallet.current_balance);
    if (refundAmount <= 0) return res.status(400).json({ error: 'Wallet has no balance to refund' });

    await client.query("UPDATE wallets SET current_balance = 0, status = 'ENDED' WHERE wallet_id = $1", [wallet.wallet_id]);
    const { rows: [ledgerEntry] } = await client.query(
      "INSERT INTO cash_ledger (wallet_id, cashier_id, transaction_type, amount) VALUES ($1, $2, 'REFUND', $3) RETURNING cash_ledger_id",
      [wallet.wallet_id, cashier_id, refundAmount]
    );
    await client.query('COMMIT');
    res.status(200).json({ message: 'Refund successful', refundedAmount: refundAmount, transaction_id: ledgerEntry.cash_ledger_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error during refund' });
  } finally {
    client.release();
  }
});

router.get('/log', async (req, res) => {
  const cashier_id = req.cashier.id;
  try {
    const logQuery = pool.query({
      text: `SELECT cl.cash_ledger_id, cl.transaction_type, cl.amount, cl.created_at, w.visitor_phone FROM cash_ledger cl JOIN wallets w ON cl.wallet_id = w.wallet_id WHERE cl.cashier_id = $1 ORDER BY cl.created_at DESC`,
      values: [cashier_id],
    });
    const summaryQuery = pool.query({
      text: `SELECT COALESCE(SUM(CASE WHEN transaction_type = 'TOPUP' THEN amount ELSE 0 END), 0) AS total_topups, COALESCE(SUM(CASE WHEN transaction_type = 'REFUND' THEN amount ELSE 0 END), 0) AS total_refunds FROM cash_ledger WHERE cashier_id = $1`,
      values: [cashier_id],
    });
    const [logResult, summaryResult] = await Promise.all([logQuery, summaryQuery]);
    res.status(200).json({ logs: logResult.rows, summary: summaryResult.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching transaction log' });
  }
});

module.exports = router;
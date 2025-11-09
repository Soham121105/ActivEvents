const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cashierAuthMiddleware = require('../middleware/cashierAuthMiddleware');

// [PUBLIC] Cashier Login
router.post('/login', async (req, res) => {
  const { cashier_name, pin, event_id } = req.body;
  if (!cashier_name || !pin || !event_id) {
    return res.status(400).json({ error: 'Event, Cashier Name, and PIN are required' });
  }
  try {
    const query = {
      text: `SELECT c.*, o.club_name, o.logo_url, o.url_slug, e.event_name FROM cashiers c JOIN events e ON c.event_id = e.event_id JOIN organizers o ON e.organizer_id = o.organizer_id WHERE c.cashier_name = $1 AND c.event_id = $2 AND c.is_active = true`,
      values: [cashier_name, event_id],
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const cashier = result.rows[0];
    const isMatch = await bcrypt.compare(pin, cashier.pin_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const payload = { cashier: { id: cashier.cashier_id, name: cashier.cashier_name, event_id: cashier.event_id, club_name: cashier.club_name, club_logo_url: cashier.logo_url, event_name: cashier.event_name, url_slug: cashier.url_slug } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token, cashier: payload.cashier });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.use(cashierAuthMiddleware);

// [PROTECTED] Check Balance
router.post('/check-balance', async (req, res) => {
  const { visitor_phone } = req.body;
  try {
    const resDb = await pool.query("SELECT current_balance FROM wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE'", [req.cashier.event_id, visitor_phone]);
    res.json({ current_balance: resDb.rows[0]?.current_balance || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Check balance failed' });
  }
});

// [PROTECTED] Top-Up (Handles both registered and unregistered users)
router.post('/topup', async (req, res) => {
  const { visitor_phone, amount, visitor_name, membership_id } = req.body;
  if (!visitor_phone || !amount) return res.status(400).json({ error: 'Phone and amount required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Lock & Check existing wallet
    const { rows: [existing] } = await client.query(
      'SELECT wallet_id, pin_hash FROM wallets WHERE event_id = $1 AND visitor_phone = $2 FOR UPDATE',
      [req.cashier.event_id, visitor_phone]
    );

    let walletId, newBalance, newPin = null, pinHash = existing?.pin_hash;

    if (existing) {
      // CASE A: ALREADY REGISTERED (Just top up)
      const update = await client.query(
        `UPDATE wallets SET current_balance = current_balance + $1, status = 'ACTIVE', visitor_name = COALESCE($2, visitor_name), membership_id = COALESCE($3, membership_id) WHERE wallet_id = $4 RETURNING current_balance`,
        [amount, visitor_name || null, membership_id || null, existing.wallet_id]
      );
      walletId = existing.wallet_id;
      newBalance = update.rows[0].current_balance;
    } else {
      // CASE B: NOT REGISTERED (Create new wallet & PIN)
      newPin = Math.floor(100000 + Math.random() * 900000).toString();
      pinHash = await bcrypt.hash(newPin, 10);
      const insert = await client.query(
        `INSERT INTO wallets (event_id, visitor_phone, current_balance, status, visitor_name, membership_id, pin_hash) VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6) RETURNING wallet_id, current_balance`,
        [req.cashier.event_id, visitor_phone, amount, visitor_name || null, membership_id || null, pinHash]
      );
      walletId = insert.rows[0].wallet_id;
      newBalance = insert.rows[0].current_balance;
    }

    // 2. Log transaction
    await client.query(`INSERT INTO cash_ledger (wallet_id, cashier_id, transaction_type, amount) VALUES ($1, $2, 'TOPUP', $3)`, [walletId, req.cashier.id, amount]);
    await client.query('COMMIT');

    res.json({ message: 'Top-up successful', new_balance: newBalance, new_pin: newPin });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Topup error:", err);
    res.status(500).json({ error: 'Top-up failed' });
  } finally {
    client.release(); // <--- PREVENTS SERVER HANGS
  }
});

// [PROTECTED] Refund
router.post('/refund', async (req, res) => {
  const { visitor_phone } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [wallet] } = await client.query("SELECT wallet_id, current_balance FROM wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE' FOR UPDATE", [req.cashier.event_id, visitor_phone]);
    if (!wallet || wallet.current_balance <= 0) throw new Error('No active balance to refund');
    
    await client.query("UPDATE wallets SET current_balance = 0, status = 'ENDED' WHERE wallet_id = $1", [wallet.wallet_id]);
    await client.query("INSERT INTO cash_ledger (wallet_id, cashier_id, transaction_type, amount) VALUES ($1, $2, 'REFUND', $3)", [wallet.wallet_id, req.cashier.id, wallet.current_balance]);
    
    await client.query('COMMIT');
    res.json({ message: 'Refund successful', refundedAmount: wallet.current_balance });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Refund failed' });
  } finally {
    client.release();
  }
});

// [PROTECTED] Log
router.get('/log', async (req, res) => {
  try {
    const [logs, summary] = await Promise.all([
      pool.query(`SELECT cl.*, w.visitor_phone FROM cash_ledger cl JOIN wallets w ON cl.wallet_id = w.wallet_id WHERE cl.cashier_id = $1 ORDER BY cl.created_at DESC LIMIT 50`, [req.cashier.id]),
      pool.query(`SELECT COALESCE(SUM(CASE WHEN transaction_type='TOPUP' THEN amount ELSE 0 END),0) as total_topups, COALESCE(SUM(CASE WHEN transaction_type='REFUND' THEN amount ELSE 0 END),0) as total_refunds FROM cash_ledger WHERE cashier_id = $1`, [req.cashier.id])
    ]);
    res.json({ logs: logs.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Log fetch failed' });
  }
});

module.exports = router;

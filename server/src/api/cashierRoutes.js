const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cashierAuthMiddleware = require('../middleware/cashierAuthMiddleware');

// [PUBLIC] Cashier Login
// This route is unchanged and remains correct.
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

// All routes below this are now protected
router.use(cashierAuthMiddleware);

// --- HELPER FUNCTION to build the dynamic wallet query ---
// --- THIS IS FIX #1 ---
const getWalletQuery = (identifier, identifierType, eventId) => {
  const isPhone = identifierType === 'phone';
  const queryText = `
    SELECT wallet_id, current_balance, visitor_phone, visitor_name, membership_id
    FROM wallets 
    WHERE event_id = $1 
      AND ${isPhone ? 'visitor_phone' : 'membership_id'} = $2 
      AND (status = 'ACTIVE' OR status = 'ENDED') -- Find active AND already-refunded wallets
  `;
  return {
    text: queryText,
    values: [eventId, identifier]
  };
};

// [PROTECTED] Check Balance
// --- UPDATED to use dynamic identifier ---
router.post('/check-balance', async (req, res) => {
  const { identifier, identifierType } = req.body;
  if (!identifier || !identifierType) {
    return res.status(400).json({ error: 'Identifier and identifier type are required.' });
  }
  try {
    const query = getWalletQuery(identifier, identifierType, req.cashier.event_id);
    const { rows: [wallet] } = await pool.query(query);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Active wallet not found. Please ask the visitor to register.' });
    }
    res.json({ current_balance: wallet.current_balance, name: wallet.visitor_name, phone: wallet.visitor_phone });
  } catch (err) {
    res.status(500).json({ error: 'Check balance failed' });
  }
});

// [PROTECTED] Top-Up
// --- THIS IS FIX #2 ---
router.post('/topup', async (req, res) => {
  const { identifier, identifierType, amount } = req.body;
  if (!identifier || !identifierType || !amount) {
    return res.status(400).json({ error: 'Identifier, type, and amount are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find the wallet dynamically (now finds ACTIVE or ENDED wallets)
    const query = getWalletQuery(identifier, identifierType, req.cashier.event_id);
    const { rows: [existing] } = await client.query(query.text + ' FOR UPDATE', query.values);

    // This is line 92. It will no longer error for refunded users.
    if (!existing) {
      throw new Error('Wallet not found. Please ask the visitor to register first.');
    }

    // 2. Wallet exists, so update balance AND set status back to 'ACTIVE'
    const update = await client.query(
      `UPDATE wallets SET current_balance = current_balance + $1, status = 'ACTIVE' WHERE wallet_id = $2 RETURNING current_balance, visitor_name`,
      [amount, existing.wallet_id]
    );
    
    const walletId = existing.wallet_id;
    const { current_balance: newBalance, visitor_name } = update.rows[0];

    // 3. Log transaction
    await client.query(`INSERT INTO cash_ledger (wallet_id, cashier_id, transaction_type, amount) VALUES ($1, $2, 'TOPUP', $3)`, [walletId, req.cashier.id, amount]);
    await client.query('COMMIT');

    res.json({ message: 'Top-up successful', new_balance: newBalance, name: visitor_name || 'Visitor' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Topup error:", err);
    if (err.message.includes('Wallet not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Top-up failed' });
  } finally {
    client.release();
  }
});

// [PROTECTED] Refund
// This route is unchanged and remains correct.
router.post('/refund', async (req, res) => {
  const { identifier, identifierType } = req.body;
  if (!identifier || !identifierType) {
    return res.status(400).json({ error: 'Identifier and identifier type are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find the wallet dynamically (this *should* only find ACTIVE wallets)
    const query = getWalletQuery(identifier, identifierType, req.cashier.event_id);
    const { rows: [wallet] } = await client.query(query.text + ' FOR UPDATE', query.values);

    // --- We only refund wallets with a balance ---
    if (!wallet || wallet.current_balance <= 0) {
      throw new Error('No active balance to refund');
    }
    
    // 2. Set balance to 0 and status to 'ENDED'
    await client.query("UPDATE wallets SET current_balance = 0, status = 'ENDED' WHERE wallet_id = $1", [wallet.wallet_id]);
    
    // 3. Log the refund
    await client.query("INSERT INTO cash_ledger (wallet_id, cashier_id, transaction_type, amount) VALUES ($1, $2, 'REFUND', $3)", [wallet.wallet_id, req.cashier.id, wallet.current_balance]);
    
    await client.query('COMMIT');
    res.json({ 
      message: 'Refund successful', 
      refundedAmount: wallet.current_balance, 
      name: wallet.visitor_name, 
      isMember: !!wallet.membership_id 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message || 'Refund failed' });
  } finally {
    client.release();
  }
});

// [PROTECTED] Cashier's Personal Log
// This route is unchanged and remains correct for the "Cashier Log"
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

// [PROTECTED] Member Refund Log
router.get('/member-logs', async (req, res) => {
  const { event_id } = req.cashier;
  try {
    const query = {
      text: `
        SELECT 
          w.wallet_id,
          w.visitor_name,
          w.visitor_phone,
          w.membership_id,
          cl.amount AS refunded_amount,
          cl.created_at AS refund_date
        FROM wallets w
        JOIN cash_ledger cl ON w.wallet_id = cl.wallet_id
        WHERE w.event_id = $1
          AND w.membership_id IS NOT NULL
          AND w.status = 'ENDED'
          AND cl.transaction_type = 'REFUND'
        ORDER BY cl.created_at DESC;
      `,
      values: [event_id]
    };
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching member logs:", err);
    res.status(500).json({ error: 'Failed to fetch member logs' });
  }
});

// [PROTECTED] Member Transaction History
router.get('/member-log/:wallet_id', async (req, res) => {
  const { wallet_id } = req.params;
  const { event_id } = req.cashier;

  try {
    // First, verify this wallet is a member wallet in the cashier's event
    const { rows: [wallet] } = await pool.query(
      `SELECT wallet_id, visitor_name, membership_id FROM wallets WHERE wallet_id = $1 AND event_id = $2 AND membership_id IS NOT NULL`,
      [wallet_id, event_id]
    );

    if (!wallet) {
      return res.status(404).json({ error: 'Member wallet not found.' });
    }

    // Now, fetch all their transactions (similar to visitorRoutes.js)
    const query = {
      text: `
        SELECT cl.cash_ledger_id as id, cl.transaction_type as type, cl.amount, cl.created_at, NULL as stall_name
        FROM cash_ledger cl WHERE cl.wallet_id = $1
        UNION ALL
        SELECT o.order_id as id, 'PURCHASE' as type, o.total_amount as amount, o.created_at, s.stall_name
        FROM orders o JOIN stalls s ON o.stall_id = s.stall_id WHERE o.wallet_id = $1
        ORDER BY created_at DESC;
      `,
      values: [wallet_id]
    };
    const { rows: logs } = await pool.query(query);
    
    res.status(200).json({ wallet, logs });

  } catch (err) {
    console.error("Error fetching member transaction log:", err.message);
    res.status(500).json({ error: 'Server error fetching member log' });
  }
});


module.exports = router;

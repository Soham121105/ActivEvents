const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware'); // --- NEW ---

// --- THIS IS THE FIX ---
// The leaky '/public/active' route has been REMOVED.
// It is replaced by /api/organizer/public-events/:urlSlug
router.get('/public/active', async (req, res) => {
  res.status(404).json({ error: 'This route is deprecated. Use /api/organizer/public-events/:clubSlug' });
});


// --- All routes below this are now protected ---
router.use(adminAuthMiddleware);


// --- Event Routes (Admin) ---
router.get('/', async (req, res) => {
  const organizer_id = req.organizer.id; // --- UPDATED ---
  try {
    const query = {
      text: 'SELECT * FROM events WHERE organizer_id = $1 ORDER BY event_date DESC',
      values: [organizer_id], // --- UPDATED ---
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const organizer_id = req.organizer.id; // --- UPDATED ---
  const { event_name, event_date } = req.body;
  if (!event_name || !event_date) {
    return res.status(400).json({ error: 'Event name and date are required.' });
  }
  try {
    const query = {
      text: `INSERT INTO events (organizer_id, event_name, event_date, status) VALUES ($1, $2, $3, 'DRAFT') RETURNING *;`,
      values: [organizer_id, event_name, event_date], // --- UPDATED ---
    };
    const result = await pool.query(query);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params; 
  const organizer_id = req.organizer.id; // --- UPDATED ---
  try {
    const query = {
      text: 'SELECT * FROM events WHERE event_id = $1 AND organizer_id = $2',
      values: [id, organizer_id], // --- UPDATED ---
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found or unauthorized' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const organizer_id = req.organizer.id; // --- UPDATED ---
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = {
      text: 'DELETE FROM events WHERE event_id = $1 AND organizer_id = $2 RETURNING *',
      values: [id, organizer_id], // --- UPDATED ---
    };
    const result = await client.query(query);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'Event and all associated data deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    if (err.code === '23503') {
        return res.status(500).json({ error: 'Could not delete event. Ensure all associated data is removable.' });
    }
    res.status(500).json({ error: 'Server error while deleting event' });
  } finally {
    client.release();
  }
});

// --- Stall Routes (Admin-managed) ---
router.get('/:id/stalls', async (req, res) => {
  const { id: event_id } = req.params;
  try {
    const query = {
      text: 'SELECT * FROM stalls WHERE event_id = $1 ORDER BY stall_name',
      values: [event_id],
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/stalls', async (req, res) => {
  const { id: event_id } = req.params;
  const { stall_name, owner_phone, commission_rate } = req.body;

  if (!stall_name || !owner_phone || !commission_rate) {
    return res.status(400).json({ error: 'Stall name, phone, and commission are required' });
  }

  const newPassword = uuidv4().substring(0, 8);
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const query = {
      text: `
        INSERT INTO stalls (stall_name, owner_phone, password_hash, event_id, commission_rate)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *; 
      `,
      values: [stall_name, owner_phone, hashedPassword, event_id, commission_rate],
    };
    const { rows: [newStall] } = await pool.query(query);

    res.status(201).json({ ...newStall, temp_password: newPassword });
  } catch (err)
 {
    console.error(err.message);
    if (err.code === '23505') return res.status(400).json({ error: 'Stall phone already exists in this event.' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:event_id/stalls/:stall_id', async (req, res) => {
  const { event_id, stall_id } = req.params;
  try {
    const query = {
      text: 'DELETE FROM stalls WHERE stall_id = $1 AND event_id = $2 RETURNING *',
      values: [stall_id, event_id],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stall not found in this event' });
    }
    res.status(200).json({ message: 'Stall deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while deleting stall' });
  }
});


// --- Cashier Routes (Admin-managed) ---
router.get('/:id/cashiers', async (req, res) => {
  const { id: event_id } = req.params;
  try {
    const query = {
      text: 'SELECT cashier_id, event_id, cashier_name, is_active, created_at FROM cashiers WHERE event_id = $1 ORDER BY cashier_name',
      values: [event_id],
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/cashiers', async (req, res) => {
  const { id: event_id } = req.params;
  const { cashier_name } = req.body;
  if (!cashier_name) return res.status(400).json({ error: 'Cashier name is required' });

  const newPin = Math.floor(1000 + Math.random() * 9000).toString();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);
    const query = {
      text: `INSERT INTO cashiers (cashier_name, pin_hash, event_id, is_active) VALUES ($1, $2, $3, true) RETURNING *;`,
      values: [cashier_name, hashedPin, event_id],
    };
    const { rows: [newCashier] } = await pool.query(query);
    res.status(201).json({ ...newCashier, temp_pin: newPin });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') return res.status(400).json({ error: 'Cashier name already exists in this event.' });
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Transaction Routes (Admin-managed) ---
router.get('/:id/transactions', async (req, res) => {
  const { id: event_id } = req.params;

  try {
    const query = {
      text: `
        SELECT
          t.transaction_id,
          t.total_amount,
          t.organizer_share,
          t.stall_share,
          t.commission_rate,
          t.created_at,
          s.stall_name,
          w.visitor_phone,
          w.visitor_name,
          w.membership_id
        FROM transactions t
        JOIN orders o ON t.order_id = o.order_id
        JOIN stalls s ON o.stall_id = s.stall_id
        LEFT JOIN wallets w ON o.wallet_id = w.wallet_id
        WHERE o.event_id = $1
        ORDER BY t.created_at DESC;
      `,
      values: [event_id],
    };
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching event transactions' });
  }
});

router.get('/:event_id/stalls/:stall_id/transactions', async (req, res) => {
  const { event_id, stall_id } = req.params;

  try {
    const summaryQuery = pool.query({
      text: `
        SELECT
          s.stall_name,
          s.commission_rate,
          SUM(t.total_amount) as total_sales,
          SUM(t.organizer_share) as total_organizer_profit,
          SUM(t.stall_share) as total_amount_owed
        FROM transactions t
        JOIN orders o ON t.order_id = o.order_id
        JOIN stalls s ON o.stall_id = s.stall_id
        WHERE o.event_id = $1 AND o.stall_id = $2
        GROUP BY s.stall_name, s.commission_rate;
      `,
      values: [event_id, stall_id],
    });

    const logQuery = pool.query({
      text: `
        SELECT
          t.transaction_id,
          t.total_amount,
          t.organizer_share,
          t.stall_share,
          t.created_at,
          o.order_id,
          w.visitor_name,
          w.visitor_phone,
          w.membership_id
        FROM transactions t
        JOIN orders o ON t.order_id = o.order_id
        LEFT JOIN wallets w ON o.wallet_id = w.wallet_id
        WHERE o.event_id = $1 AND o.stall_id = $2
        ORDER BY t.created_at DESC;
      `,
      values: [event_id, stall_id],
    });

    const [summaryResult, logResult] = await Promise.all([summaryQuery, logQuery]);

    res.status(200).json({
      summary: summaryResult.rows[0] || null,
      logs: logResult.rows,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching stall transactions' });
  }
});
router.delete('/:event_id/cashiers/:cashier_id', async (req, res) => {
  const { event_id, cashier_id } = req.params;
  // We also need to verify this event belongs to the logged-in organizer for security
  const organizer_id = req.organizer.id;

  try {
    const query = {
      text: `DELETE FROM cashiers 
             WHERE cashier_id = $1 AND event_id = $2 
             AND event_id IN (SELECT event_id FROM events WHERE organizer_id = $3)
             RETURNING *`,
      values: [cashier_id, event_id, organizer_id],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cashier not found or unauthorized' });
    }
    res.status(200).json({ message: 'Cashier deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while deleting cashier' });
  }
});

router.get('/:id/financial-summary', async (req, res) => {
  const { id: event_id } = req.params;
  const organizer_id = req.organizer.id;

  try {
    // 1. Verify event belongs to organizer
    const eventCheck = await pool.query('SELECT event_id FROM events WHERE event_id = $1 AND organizer_id = $2', [event_id, organizer_id]);
    if (eventCheck.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    // 2. Get Net Cash Flow (Cashier In - Cashier Out)
    // We join with CASHIERS to ensure we only get logs for this event's cashiers
    const cashQuery = pool.query({
      text: `
        SELECT
          COALESCE(SUM(CASE WHEN transaction_type = 'TOPUP' THEN amount ELSE 0 END), 0) AS total_in,
          COALESCE(SUM(CASE WHEN transaction_type = 'REFUND' THEN amount ELSE 0 END), 0) AS total_out
        FROM cash_ledger cl
        JOIN cashiers c ON cl.cashier_id = c.cashier_id
        WHERE c.event_id = $1
      `,
      values: [event_id],
    });

    // 3. Get Sales Flow (Total Sales, Commission, Owed)
    // We join with ORDERS to filter by event_id
    const salesQuery = pool.query({
      text: `
        SELECT
          COALESCE(SUM(t.total_amount), 0) as total_sales,
          COALESCE(SUM(t.organizer_share), 0) as total_commission,
          COALESCE(SUM(t.stall_share), 0) as total_owed
        FROM transactions t
        JOIN orders o ON t.order_id = o.order_id
        WHERE o.event_id = $1
      `,
      values: [event_id],
    });

    // 4. Get Per-Stall Breakdown
    const stallsQuery = pool.query({
      text: `
        SELECT 
          s.stall_id,
          s.stall_name,
          COALESCE(SUM(t.total_amount), 0) as stall_sales,
          COALESCE(SUM(t.organizer_share), 0) as stall_commission,
          COALESCE(SUM(t.stall_share), 0) as stall_revenue
        FROM stalls s
        LEFT JOIN orders o ON s.stall_id = o.stall_id AND o.event_id = $1
        LEFT JOIN transactions t ON o.order_id = t.order_id
        WHERE s.event_id = $1
        GROUP BY s.stall_id, s.stall_name
        ORDER BY stall_sales DESC
      `,
      values: [event_id]
    });

    const [cashRes, salesRes, stallsRes] = await Promise.all([cashQuery, salesQuery, stallsQuery]);

    res.json({
      cash: cashRes.rows[0],
      sales: salesRes.rows[0],
      stalls: stallsRes.rows
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching financial summary' });
  }
});

module.exports = router;

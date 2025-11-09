const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * [POST] /api/stalls/login
 * UPDATED: Now joins organizers to get the url_slug
 */
router.post('/login', async (req, res) => {
  const { phone, password, event_id } = req.body;
  if (!phone || !password || !event_id) {
    return res.status(400).json({ error: 'Phone, password, and event are required' });
  }

  try {
    // --- UPDATED QUERY ---
    // Join with events and organizers to get the club's url_slug
    const query = {
      text: `
        SELECT 
          s.stall_id, s.stall_name, s.owner_phone, s.event_id, 
          s.commission_rate, s.password_hash,
          o.url_slug 
        FROM stalls s
        JOIN events e ON s.event_id = e.event_id
        JOIN organizers o ON e.organizer_id = o.organizer_id
        WHERE s.owner_phone = $1 AND s.event_id = $2
      `,
      values: [phone, event_id],
    };
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const stall = result.rows[0];

    // Check the password
    const isMatch = await bcrypt.compare(password, stall.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // --- UPDATED PAYLOAD ---
    // The stall's token now knows its club's public URL
    const payload = {
      stall: {
        id: stall.stall_id,
        name: stall.stall_name,
        phone: stall.owner_phone,
        event_id: stall.event_id, 
        commission_rate: stall.commission_rate,
        url_slug: stall.url_slug // <--- THIS IS THE PERMANENT FIX
      }
    };

    // Sign and send the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        // Send the full stall object to the frontend auth context
        res.status(200).json({ token, stall: payload.stall }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// --- ALL ROUTES BELOW ARE PROTECTED ---
router.use(authMiddleware);

/**
 * [GET] /api/stalls/transactions
 * Fetches the transaction log for the *logged-in* stall
 */
router.get('/transactions', async (req, res) => {
  const stall_id = req.stall.id; // From the "Smart JWT"

  try {
    const summaryQuery = pool.query({
      text: `
        SELECT
          SUM(t.total_amount) as total_sales,
          SUM(t.stall_share) as your_earnings
        FROM transactions t
        JOIN orders o ON t.order_id = o.order_id
        WHERE o.stall_id = $1
      `,
      values: [stall_id],
    });

    const logQuery = pool.query({
      text: `
        SELECT
          t.transaction_id,
          t.total_amount,
          t.commission_rate,
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
        WHERE o.stall_id = $1
        ORDER BY t.created_at DESC;
      `,
      values: [stall_id],
    });
    
    const [summaryResult, logResult] = await Promise.all([summaryQuery, logQuery]);

    res.status(200).json({
      summary: summaryResult.rows[0] || { total_sales: 0, your_earnings: 0 },
      logs: logResult.rows,
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching stall transactions' });
  }
});


module.exports = router;

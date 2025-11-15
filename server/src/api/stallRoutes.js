const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

// [PUBLIC] Stall Login
// --- UPDATED for 2-step temporary password flow ---
router.post('/login', async (req, res) => {
  const { phone, password, event_id } = req.body;
  if (!phone || !password || !event_id) {
    return res.status(400).json({ error: 'Phone, password, and event are required' });
  }
  try {
    const query = {
      text: `
        SELECT 
          s.stall_id, s.stall_name, s.owner_phone, s.event_id, 
          s.commission_rate, s.password_hash, s.logo_url, s.description,
          s.is_temp_password, -- NEW: Check this flag
          o.url_slug, o.club_name, o.logo_url as club_logo_url
        FROM stalls s
        JOIN events e ON s.event_id = e.event_id
        JOIN organizers o ON e.organizer_id = o.organizer_id
        WHERE s.owner_phone = $1 AND s.event_id = $2
      `,
      values: [phone, event_id],
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    
    const stall = result.rows[0];
    const isMatch = await bcrypt.compare(password, stall.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // --- NEW LOGIC ---
    // If it's a temp password, send a "change required" response with a short-lived token
    if (stall.is_temp_password) {
      const payload = { temp_stall: { id: stall.stall_id } }; // Special, limited-scope token
      const tempToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
      return res.status(200).json({ 
        requiresPasswordChange: true, 
        tempToken: tempToken
      });
    }

    // --- Regular Login ---
    const payload = {
      stall: {
        id: stall.stall_id,
        name: stall.stall_name,
        phone: stall.owner_phone,
        event_id: stall.event_id, 
        commission_rate: stall.commission_rate,
        url_slug: stall.url_slug,
        logo_url: stall.logo_url,
        description: stall.description,
        club_name: stall.club_name,
        club_logo_url: stall.club_logo_url
      }
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ token, stall: payload.stall }); 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// [PUBLIC-ISH] Set New Password
// This route is used *only* by the first-time login flow.
// It requires the special tempToken from the login route.
router.post('/set-password', async (req, res) => {
  const { tempToken, newPassword } = req.body;
  if (!tempToken || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.temp_stall) {
      throw new Error('Not a valid temporary token.');
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }

  try {
    const stallId = decoded.temp_stall.id;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password and set the temp_password flag to false
    await pool.query(
      `UPDATE stalls SET password_hash = $1, is_temp_password = false WHERE stall_id = $2`,
      [hashedPassword, stallId]
    );

    res.status(200).json({ message: 'Password updated successfully. Please log in again.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating password.' });
  }
});


// This middleware now protects all routes below
router.use(authMiddleware);

// --- NEW: Route to update stall details ---
router.put('/me', async (req, res) => {
  const stall_id = req.stall.id;
  const { logo_url, description } = req.body;
  try {
    const query = {
      text: 'UPDATE stalls SET logo_url = $1, description = $2 WHERE stall_id = $3 RETURNING *',
      values: [logo_url, description, stall_id]
    };
    const { rows: [updatedStall] } = await pool.query(query);
    res.json(updatedStall);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating stall' });
  }
});

// [PROTECTED] Get stall transactions
router.get('/transactions', async (req, res) => {
    const stall_id = req.stall.id; 
    try {
        const summaryQuery = pool.query({
          text: `SELECT SUM(t.total_amount) as total_sales, SUM(t.stall_share) as your_earnings FROM transactions t JOIN orders o ON t.order_id = o.order_id WHERE o.stall_id = $1`,
          values: [stall_id],
        });
        const logQuery = pool.query({
          text: `SELECT t.transaction_id, t.total_amount, t.commission_rate, t.organizer_share, t.stall_share, t.created_at, o.order_id, w.visitor_name, w.visitor_phone, w.membership_id FROM transactions t JOIN orders o ON t.order_id = o.order_id LEFT JOIN wallets w ON o.wallet_id = w.wallet_id WHERE o.stall_id = $1 ORDER BY t.created_at DESC`,
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

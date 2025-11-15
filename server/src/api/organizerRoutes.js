const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// --- NEW: Import admin auth middleware ---
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

/**
 * [PUBLIC GET] /api/organizer/public-events/:urlSlug
 * This is the NEW, SECURE way to fetch events for login pages.
 * It replaces the leaky /api/events/public/active route.
 */
router.get('/public-events/:urlSlug', async (req, res) => {
  const { urlSlug } = req.params;
  try {
    const query = {
      text: `
        SELECT e.event_id, e.event_name 
        FROM events e
        JOIN organizers o ON e.organizer_id = o.organizer_id
        WHERE o.url_slug = $1 AND e.status != 'COMPLETED'
        ORDER BY e.event_date DESC
      `,
      values: [urlSlug],
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching club events' });
  }
});

/**
 * [POST] /api/organizer/login
 * --- UPDATED for temporary password flow ---
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Find the organizer by email
    const query = {
      // --- NEW: Select is_temp_password flag ---
      text: 'SELECT * FROM organizers WHERE email = $1',
      values: [email],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const organizer = result.rows[0];

    // 2. Check the password
    const isMatch = await bcrypt.compare(password, organizer.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // --- NEW LOGIC: Check if password is temporary ---
    if (organizer.is_temp_password) {
      // Issue a short-lived token for password reset
      const payload = { temp_admin: { id: organizer.organizer_id } };
      const tempToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
      return res.status(200).json({
        requiresPasswordChange: true,
        tempToken: tempToken
      });
    }

    // 3. Create the "Smart" JWT with branding info
    const payload = {
      organizer: {
        id: organizer.organizer_id,
        name: organizer.club_name,
        email: organizer.email,
        logo_url: organizer.logo_url,
        url_slug: organizer.url_slug
      }
    };

    // 4. Sign and send the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, organizer: payload.organizer }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- NEW ROUTE: Set New Password for Admin ---
router.post('/set-password', async (req, res) => {
  const { tempToken, newPassword } = req.body;
  if (!tempToken || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.temp_admin) { // Must be a temp admin token
      throw new Error('Not a valid temporary token.');
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }

  try {
    const adminId = decoded.temp_admin.id;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and set flag to false
    await pool.query(
      `UPDATE organizers SET password_hash = $1, is_temp_password = false WHERE organizer_id = $2`,
      [hashedPassword, adminId]
    );

    res.status(200).json({ message: 'Password updated successfully. Please log in again.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating password.' });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
 * The main login for the Event Manager (Super Admin)
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Find the organizer by email
    const query = {
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

    // 3. Create the "Smart" JWT with branding info
    const payload = {
      organizer: {
        id: organizer.organizer_id,
        name: organizer.club_name,
        email: organizer.email,
        logo_url: organizer.logo_url,
        url_slug: organizer.url_slug // Send the slug to the frontend
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

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * [POST] /api/stalls/login
 * This is our new "SMART LOGIN" for Stall Owners
 */
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }

  try {
    // 1. Find the stall by their phone number
    const query = {
      text: 'SELECT * FROM Stalls WHERE owner_phone = $1',
      values: [phone],
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const stall = result.rows[0];

    // 2. Check the password
    const isMatch = await bcrypt.compare(password, stall.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. THIS IS THE "SMART" PART
    // We create a token that includes the stall_id AND the event_id
    const payload = {
      stall: {
        id: stall.stall_id,
        name: stall.stall_name,
        phone: stall.owner_phone,
        event_id: stall.event_id, // This is the magic!
        commission_rate: stall.commission_rate // We'll add this to the token too!
      }
    };

    // 4. Sign and send the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        // We send back the token AND the stall data
        res.status(200).json({ token, stall: payload.stall }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

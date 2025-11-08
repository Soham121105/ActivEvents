const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// --- TODO: PASTE YOUR REAL ADMIN ID HERE ---
const HARDCODED_ORGANIZER_ID = "2d2ec44b-b3c8-4982-9435-283aedf63c87"; 

// --- Event Routes ---
router.get('/', async (req, res) => {
  try {
    const query = {
      text: 'SELECT * FROM Events WHERE organizer_id = $1 ORDER BY event_date DESC',
      values: [HARDCODED_ORGANIZER_ID],
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { event_name, event_date } = req.body;
  if (!event_name || !event_date) {
    return res.status(400).json({ error: 'Event name and date are required.' });
  }
  try {
    const query = {
      text: `INSERT INTO Events (organizer_id, event_name, event_date, status) VALUES ($1, $2, $3, 'DRAFT') RETURNING *;`,
      values: [HARDCODED_ORGANIZER_ID, event_name, event_date],
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
  try {
    const query = {
      text: 'SELECT * FROM Events WHERE event_id = $1 AND organizer_id = $2',
      values: [id, HARDCODED_ORGANIZER_ID],
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Stall Routes (FIXED with commission_rate) ---
router.get('/:id/stalls', async (req, res) => {
  const { id: event_id } = req.params;
  try {
    const query = {
      text: 'SELECT * FROM Stalls WHERE event_id = $1 ORDER BY stall_name',
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
  // 1. Get commission_rate from request
  const { stall_name, owner_phone, commission_rate } = req.body;

  if (!stall_name || !owner_phone || !commission_rate) {
    return res.status(400).json({ error: 'Stall name, phone, and commission are required' });
  }

  const newPassword = uuidv4().substring(0, 8);
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 2. Insert it into the database
    const query = {
      text: `
        INSERT INTO Stalls (stall_name, owner_phone, password_hash, event_id, commission_rate)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *; 
      `,
      values: [stall_name, owner_phone, hashedPassword, event_id, commission_rate],
    };
    const { rows: [newStall] } = await pool.query(query);

    res.status(201).json({ ...newStall, temp_password: newPassword });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') return res.status(400).json({ error: 'Stall phone already exists in this event.' });
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Cashier Routes ---
router.get('/:id/cashiers', async (req, res) => {
  const { id: event_id } = req.params;
  try {
    const query = {
      text: 'SELECT * FROM Cashiers WHERE event_id = $1 ORDER BY cashier_name',
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
      text: `INSERT INTO Cashiers (cashier_name, pin_hash, event_id, is_active) VALUES ($1, $2, $3, true) RETURNING *;`,
      values: [cashier_name, hashedPin, event_id],
    };
    const { rows: [newCashier] } = await pool.query(query);
    res.status(201).json({ ...newCashier, temp_pin: newPin });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

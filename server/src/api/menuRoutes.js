const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const stallId = req.stall.id; 
    // --- UPDATED QUERY ---
    const query = {
      text: 'SELECT * FROM menu_items WHERE stall_id = $1 ORDER BY item_name',
      values: [stallId],
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching menu' });
  }
});

router.post('/', async (req, res) => {
  const stallId = req.stall.id;
  // --- GET NEW FIELDS ---
  const { item_name, price, is_veg, is_spicy, allergens, image_url, description } = req.body;
  
  if (!item_name || !price) {
    return res.status(400).json({ error: 'Item name and price are required' });
  }
  try {
    const query = {
      // --- INSERT NEW FIELDS ---
      text: `
        INSERT INTO menu_items 
          (stall_id, item_name, price, is_veg, is_spicy, allergens, is_available, image_url, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *; 
      `,
      values: [stallId, item_name, price, is_veg, is_spicy, allergens, true, image_url || null, description || null], 
    };
    const result = await pool.query(query);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /api/menu:", err.message);
    res.status(500).json({ error: 'Server error while creating menu item' });
  }
});

// ... [KEEP PUT /:id/stock AND DELETE /:id AS IS] ...
router.put('/:id/stock', async (req, res) => {
    const { id: itemId } = req.params;
    const { is_available } = req.body;
    const stallId = req.stall.id;
    if (typeof is_available !== 'boolean') return res.status(400).json({ error: 'is_available must be a boolean' });
    try {
      const query = {
        text: `UPDATE menu_items SET is_available = $1 WHERE item_id = $2 AND stall_id = $3 RETURNING *;`,
        values: [is_available, itemId, stallId],
      };
      const result = await pool.query(query);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found or permission denied' });
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error while updating stock' });
    }
  });
  
  router.delete('/:id', async (req, res) => {
    const { id: itemId } = req.params;
    const stallId = req.stall.id;
    try {
      const query = {
        text: `DELETE FROM menu_items WHERE item_id = $1 AND stall_id = $2 RETURNING *;`,
        values: [itemId, stallId],
      };
      const result = await pool.query(query);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found or permission denied' });
      res.status(200).json({ message: 'Item deleted successfully' }); 
    } catch (err) {
      console.error(err.message);
      if (err.code === '23503') return res.status(400).json({ error: 'Cannot delete item: It is part of an existing order.' });
      res.status(500).json({ error: 'Server error while deleting item' });
    }
  });

module.exports = router;

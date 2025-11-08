const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes in this file
router.use(authMiddleware);

/**
 * [GET] /api/menu
 */
router.get('/', async (req, res) => {
  try {
    const stallId = req.stall.id; 
    const query = {
      text: 'SELECT * FROM Menu_Items WHERE stall_id = $1 ORDER BY item_name',
      values: [stallId],
    };
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching menu' });
  }
});

/**
 * [POST] /api/menu
 */
router.post('/', async (req, res) => {
  const stallId = req.stall.id;
  const { item_name, price, is_veg, is_spicy, allergens } = req.body;
  if (!item_name || !price) {
    return res.status(400).json({ error: 'Item name and price are required' });
  }
  try {
    const query = {
      text: `
        INSERT INTO Menu_Items 
          (stall_id, item_name, price, is_veg, is_spicy, allergens, is_available)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *; 
      `,
      values: [stallId, item_name, price, is_veg, is_spicy, allergens, true], 
    };
    const result = await pool.query(query);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /api/menu:", err.message);
    res.status(500).json({ error: 'Server error while creating menu item' });
  }
});

/**
 * [PUT] /api/menu/:id/stock
 */
router.put('/:id/stock', async (req, res) => {
  const { id: itemId } = req.params;
  const { is_available } = req.body;
  const stallId = req.stall.id;
  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'is_available must be a boolean' });
  }
  try {
    const query = {
      text: `
        UPDATE Menu_Items
        SET is_available = $1
        WHERE item_id = $2 AND stall_id = $3
        RETURNING *;
      `,
      values: [is_available, itemId, stallId],
    };
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found or permission denied' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while updating stock' });
  }
});

// --- 1. ADD THIS NEW "DELETE" ROUTE ---
/**
 * [DELETE] /api/menu/:id
 * Delete a menu item
 */
router.delete('/:id', async (req, res) => {
  const { id: itemId } = req.params; // The ID of the item to delete
  const stallId = req.stall.id;       // The ID of the logged-in stall

  try {
    const query = {
      text: `
        DELETE FROM Menu_Items
        WHERE item_id = $1 AND stall_id = $2
        RETURNING *;
      `,
      // We include "stall_id = $2" for security
      // to ensure a stall can *only* delete *their own* items.
      values: [itemId, stallId],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found or you do not have permission' });
    }
    
    // Send back a success message
    res.status(200).json({ message: 'Item deleted successfully' }); 
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while deleting item' });
  }
});


module.exports = router;

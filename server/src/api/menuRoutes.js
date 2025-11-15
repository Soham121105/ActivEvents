const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/menu
// No changes needed, still correct.
router.get('/', async (req, res) => {
  try {
    const stallId = req.stall.id; 
    const query = {
      // --- UPDATED QUERY to select new inventory fields ---
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

// POST /api/menu
// --- UPDATED to include inventory fields ---
router.post('/', async (req, res) => {
  const stallId = req.stall.id;
  const { 
    item_name, price, is_veg, is_spicy, allergens, image_url, description,
    track_inventory, stock_quantity // NEW FIELDS
  } = req.body;
  
  if (!item_name || !price) {
    return res.status(400).json({ error: 'Item name and price are required' });
  }
  try {
    const query = {
      text: `
        INSERT INTO menu_items 
          (stall_id, item_name, price, is_veg, is_spicy, allergens, is_available, image_url, description, track_inventory, stock_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *; 
      `,
      values: [
        stallId, item_name, price, is_veg, is_spicy, allergens, true, 
        image_url || null, description || null,
        track_inventory || false, // NEW
        stock_quantity || 0      // NEW
      ], 
    };
    const result = await pool.query(query);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /api/menu:", err.message);
    res.status(500).json({ error: 'Server error while creating menu item' });
  }
});

// --- NEW ROUTE: PUT /api/menu/:id (For Editing) ---
router.put('/:id', async (req, res) => {
  const { id: itemId } = req.params;
  const stallId = req.stall.id;
  const {
    item_name, price, is_veg, is_spicy, allergens, image_url, description,
    track_inventory, stock_quantity
  } = req.body;

  if (!item_name || !price) {
    return res.status(400).json({ error: 'Item name and price are required' });
  }

  try {
    const query = {
      text: `
        UPDATE menu_items 
        SET 
          item_name = $1, price = $2, is_veg = $3, is_spicy = $4, allergens = $5,
          image_url = $6, description = $7, track_inventory = $8, stock_quantity = $9
        WHERE item_id = $10 AND stall_id = $11
        RETURNING *;
      `,
      values: [
        item_name, price, is_veg, is_spicy, allergens, image_url, description,
        track_inventory, stock_quantity,
        itemId, stallId
      ]
    };
    const { rows: [updatedItem] } = await pool.query(query);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found or unauthorized.' });
    }
    res.status(200).json(updatedItem);
  } catch (err) {
    console.error("Error in PUT /api/menu/:id:", err.message);
    res.status(500).json({ error: 'Server error while updating menu item' });
  }
});


// PUT /api/menu/:id/stock (Toggle availability)
// This route is unchanged, but now inventory can *also* set this to false.
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

// --- NEW ROUTE: POST /api/menu/:id/restock ---
router.post('/:id/restock', async (req, res) => {
  const { id: itemId } = req.params;
  const { quantity } = req.body;
  const stallId = req.stall.id;

  const restockQty = parseInt(quantity, 10);
  if (!restockQty || restockQty <= 0) {
    return res.status(400).json({ error: 'A valid restock quantity is required.' });
  }

  try {
    const query = {
      text: `
        UPDATE menu_items 
        SET 
          stock_quantity = stock_quantity + $1,
          is_available = true -- Automatically make it available on restock
        WHERE item_id = $2 AND stall_id = $3
        RETURNING *;
      `,
      values: [restockQty, itemId, stallId]
    };
    const { rows: [updatedItem] } = await pool.query(query);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found or unauthorized.' });
    }
    res.status(200).json(updatedItem);
  } catch (err) {
    console.error("Error in POST /api/menu/:id/restock:", err.message);
    res.status(500).json({ error: 'Server error while restocking item' });
  }
});

  
// DELETE /api/menu/:id
// This route is unchanged and remains correct.
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

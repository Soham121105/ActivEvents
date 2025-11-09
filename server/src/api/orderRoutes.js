const express = require('express');
const pool = require('../config/db'); // --- FIX ---
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/orders/live (For the KDS)
router.get('/live', async (req, res) => {
  const stallId = req.stall.id;
  try {
    const query = {
      text: `
        SELECT 
          o.order_id, 
          o.total_amount, 
          o.order_status, 
          o.created_at,
          w.visitor_phone,
          w.membership_id,
          COALESCE(w.visitor_name, o.customer_name, w.visitor_phone) as customer_display_name
        FROM orders o
        LEFT JOIN wallets w ON o.wallet_id = w.wallet_id
        WHERE o.stall_id = $1 AND o.order_status = 'PENDING'
        ORDER BY o.created_at ASC; 
      `,
      values: [stallId],
    };
    const { rows: orders } = await pool.query(query);

    const fullOrders = await Promise.all(
      orders.map(async (order) => {
        const itemsQuery = {
          text: 'SELECT item_name, quantity FROM order_items WHERE order_id = $1',
          values: [order.order_id],
        };
        const { rows: items } = await pool.query(itemsQuery);
        return { ...order, items };
      })
    );
    res.status(200).json(fullOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching live orders' });
  }
});

// POST /api/orders/manual (For the "Quick POS")
router.post('/manual', async (req, res) => {
  const stallId = req.stall.id;
  const { customer_name, items, total_amount, payment_type } = req.body; 

  if (!items || items.length === 0 || !total_amount || !payment_type) {
    return res.status(400).json({ error: 'Missing required fields for manual order' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create the Order
    const orderQuery = {
      text: `
        INSERT INTO orders (stall_id, total_amount, order_status, customer_name, payment_type, event_id)
        SELECT $1, $2, 'PENDING', $3, $4, event_id FROM stalls WHERE stall_id = $1
        RETURNING order_id, created_at, event_id;
      `,
      values: [stallId, total_amount, customer_name || 'Walk-up', payment_type],
    };
    const { rows: [newOrder] } = await client.query(orderQuery);

    // 2. Insert all items into Order_Items
    const itemInsertPromises = items.map(item => {
      const itemQuery = {
        text: `
          INSERT INTO order_items (order_id, item_id, item_name, quantity, price_per_item)
          VALUES ($1, $2, $3, $4, $5);
        `,
        values: [newOrder.order_id, item.item_id, item.item_name, item.quantity, item.price],
      };
      return client.query(itemQuery);
    });
    
    await Promise.all(itemInsertPromises);

    await client.query('COMMIT');

    // 4. Return the new, complete order
    const finalOrder = {
      order_id: newOrder.order_id,
      created_at: newOrder.created_at,
      stall_id: stallId,
      customer_display_name: customer_name || 'Walk-up', 
      total_amount: total_amount,
      order_status: 'PENDING',
      payment_type: payment_type,
      items: items,
      visitor_phone: null, 
      membership_id: null
    };
    
    req.io.to(stallId).emit('new_order', finalOrder);

    res.status(201).json(finalOrder);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error in POST /api/orders/manual:", err.message);
    res.status(500).json({ error: 'Server error while creating manual order' });
  } finally {
    client.release();
  }
});

// POST /api/orders/:id/complete (For the KDS)
router.post('/:id/complete', async (req, res) => {
  const { id: orderId } = req.params;
  const stallId = req.stall.id;

  try {
    const query = {
      text: `
        UPDATE orders
        SET order_status = 'COMPLETED'
        WHERE order_id = $1 AND stall_id = $2 AND order_status = 'PENDING'
        RETURNING *;
      `,
      values: [orderId, stallId],
    };
    const { rows: [updatedOrder] } = await pool.query(query);

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found or not pending' });
    }

    req.io.to(stallId).emit('remove_order', orderId);

    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while completing order' });
  }
});

module.exports = router;

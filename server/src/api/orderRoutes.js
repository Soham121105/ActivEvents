const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/orders/live (For the KDS)
// THIS QUERY IS NOW UPGRADED TO INCLUDE FULL VISITOR DETAILS
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
          -- This logic displays the "best" name available for the KDS
          -- 1. Wallet Name (if present)
          -- 2. Manual Order Name (if no wallet)
          -- 3. Wallet Phone (as a fallback)
          COALESCE(w.visitor_name, o.customer_name, w.visitor_phone) as customer_display_name
        FROM Orders o
        LEFT JOIN Wallets w ON o.wallet_id = w.wallet_id
        WHERE o.stall_id = $1 AND o.order_status = 'PENDING'
        ORDER BY o.created_at ASC; 
      `,
      values: [stallId],
    };
    const { rows: orders } = await pool.query(query);

    // This part remains the same, fetching the line items for each order
    const fullOrders = await Promise.all(
      orders.map(async (order) => {
        const itemsQuery = {
          text: 'SELECT item_name, quantity FROM Order_Items WHERE order_id = $1',
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
        INSERT INTO Orders (stall_id, total_amount, order_status, customer_name, payment_type, event_id)
        SELECT $1, $2, 'PENDING', $3, $4, event_id FROM Stalls WHERE stall_id = $1
        RETURNING order_id, created_at, event_id;
      `,
      values: [stallId, total_amount, customer_name || 'Walk-up', payment_type],
    };
    const { rows: [newOrder] } = await client.query(orderQuery);

    // 2. Insert all items into Order_Items
    const itemInsertPromises = items.map(item => {
      const itemQuery = {
        text: `
          INSERT INTO Order_Items (order_id, item_id, item_name, quantity, price_per_item)
          VALUES ($1, $2, $3, $4, $5);
        `,
        values: [newOrder.order_id, item.item_id, item.item_name, item.quantity, item.price],
      };
      return client.query(itemQuery);
    });
    
    await Promise.all(itemInsertPromises);

    // 3. We will skip the 'Transactions' table for now,
    // as a manual cash sale doesn't need a digital "split" record.
    // We can add this later if the admin needs it for reporting.

    await client.query('COMMIT');

    // 4. Return the new, complete order
    const finalOrder = {
      order_id: newOrder.order_id,
      created_at: newOrder.created_at,
      stall_id: stallId,
      // This name will be picked up by the COALESCE in the /live query
      customer_display_name: customer_name || 'Walk-up', 
      total_amount: total_amount,
      order_status: 'PENDING',
      payment_type: payment_type,
      items: items,
      visitor_phone: null, // Manual orders don't have a phone on the wallet
      membership_id: null  // Manual orders don't have a membership ID
    };
    
    // We will emit the socket.io event here later
    // req.io.to(stallId).emit('new_order', finalOrder);

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
        UPDATE Orders
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

    // We will emit the socket.io event here later
    // req.io.to(stallId).emit('remove_order', orderId);

    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while completing order' });
  }
});
const jwt = require('jsonwebtoken');
// We have REMOVED the "require('dotenv').config()" line.
// This is correct, because 'server.js' already loaded it.

// This is our "gatekeeper" function
module.exports = function(req, res, next) {
  // 1. Get the token from the request header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // 2. Check if the token is valid
  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // 3. Verify the token
    // This will now work, because process.env.JWT_SECRET was loaded by server.js
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the 'stall' info to the request
    req.stall = decoded.stall; 
    
    // 5. Continue
    next(); 

  } catch (err) {
    console.error('Token verification failed:', err.message);
    // 6. --- THIS IS THE FIX ---
    // We must RETURN after sending the error to stop execution
    return res.status(401).json({ error: 'Token is not valid' });
  }
};


module.exports = router;

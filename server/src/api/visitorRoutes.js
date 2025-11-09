const express = require('express');
const pool = require('../config/db'); // --- FIX ---
const router = express.Router();
const jwt = require('jsonwebtoken');
const visitorAuthMiddleware = require('../middleware/visitorAuthMiddleware');

// === 1. VISITOR LOGIN (Public) ===
router.post('/login', async (req, res) => {
  const { visitor_phone, event_id } = req.body;
  if (!visitor_phone || !event_id) {
    return res.status(400).json({ error: 'Phone number and Event ID are required' });
  }

  try {
    const query = {
      text: "SELECT * FROM wallets WHERE visitor_phone = $1 AND event_id = $2 AND status = 'ACTIVE'",
      values: [visitor_phone, event_id]
    };
    const { rows: [wallet] } = await pool.query(query);

    if (!wallet) {
      return res.status(404).json({ error: 'No active wallet found. Please visit a cashier to top-up.' });
    }

    const payload = {
      visitor: {
        wallet_id: wallet.wallet_id,
        event_id: wallet.event_id,
        phone: wallet.visitor_phone
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, wallet }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- All routes below this are protected ---
router.use(visitorAuthMiddleware);

// === 2. GET VISITOR'S WALLET (Secure) ===
router.get('/me', (req, res) => {
  res.status(200).json(req.wallet);
});

// === 3. GET A STALL'S MENU (Secure) ===
router.get('/stall/:stall_id/menu', async (req, res) => {
  const { stall_id } = req.params;
  try {
    const stallQuery = pool.query('SELECT stall_name FROM stalls WHERE stall_id = $1', [stall_id]);
    const menuQuery = pool.query(
      "SELECT item_id, item_name, price, is_veg, is_spicy, allergens FROM menu_items WHERE stall_id = $1 AND is_available = true ORDER BY item_name",
      [stall_id]
    );

    const [stallResult, menuResult] = await Promise.all([stallQuery, menuQuery]);

    if (stallResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    res.status(200).json({
      stall_name: stallResult.rows[0].stall_name,
      menu_items: menuResult.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching menu' });
  }
});

// === 4. THE TRANSACTION ENGINE (Secure) ===
router.post('/stall/:stall_id/pay', async (req, res) => {
  const { stall_id } = req.params;
  const { items } = req.body; 
  const wallet = req.wallet; 
  const event_id = wallet.event_id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const client = await pool.connect();

  try {
    // 1. Verify prices and calculate total...
    const itemIds = items.map(item => item.item_id);
    const priceCheckQuery = {
      text: `SELECT item_id, item_name, price FROM menu_items WHERE item_id = ANY($1::uuid[]) AND stall_id = $2 AND is_available = true`,
      values: [itemIds, stall_id]
    };
    const { rows: dbItems } = await client.query(priceCheckQuery);

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      const dbItem = dbItems.find(i => i.item_id === cartItem.item_id);
      if (!dbItem) {
        throw new Error('An item in your cart is no longer available. Please refresh.');
      }
      calculatedTotal += parseFloat(dbItem.price) * parseInt(cartItem.quantity, 10);
      validatedItems.push({
        ...cartItem,
        item_name: dbItem.item_name,
        price: parseFloat(dbItem.price)
      });
    }

    if (parseFloat(wallet.current_balance) < calculatedTotal) {
      throw new Error('Insufficient funds. Please top-up your wallet.');
    }

    // 3. Get Stall's commission rate
    const { rows: [stall] } = await client.query('SELECT commission_rate FROM stalls WHERE stall_id = $1', [stall_id]);
    const commission_rate = parseFloat(stall.commission_rate);
    const organizer_share = calculatedTotal * commission_rate;
    const stall_share = calculatedTotal - organizer_share;

    // 4. START THE ATOMIC TRANSACTION
    await client.query('BEGIN');

    // 4a. Atomic balance check
    const { rows: [updatedWallet] } = await client.query(
      "UPDATE wallets SET current_balance = current_balance - $1 WHERE wallet_id = $2 AND current_balance >= $1 RETURNING current_balance",
      [calculatedTotal, wallet.wallet_id]
    );

    if (!updatedWallet) {
      throw new Error('Insufficient funds. Please top-up your wallet.');
    }

    // 4c. Create the Order
    const { rows: [newOrder] } = await client.query(
      `INSERT INTO orders (event_id, stall_id, wallet_id, total_amount, order_status, payment_type)
       VALUES ($1, $2, $3, $4, 'PENDING', 'TOKEN') RETURNING order_id, created_at`,
      [event_id, stall_id, wallet.wallet_id, calculatedTotal]
    );

    // 4d. Insert Order Items
    const itemInsertPromises = validatedItems.map(item => {
      return client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, quantity, price_per_item)
         VALUES ($1, $2, $3, $4, $5)`,
        [newOrder.order_id, item.item_id, item.item_name, item.quantity, item.price]
      );
    });
    await Promise.all(itemInsertPromises);

    // 4e. Log the Revenue Split
    await client.query(
      `INSERT INTO transactions (order_id, total_amount, commission_rate, organizer_share, stall_share)
       VALUES ($1, $2, $3, $4, $5)`,
      [newOrder.order_id, calculatedTotal, commission_rate, organizer_share, stall_share]
    );

    // 4f. COMMIT!
    await client.query('COMMIT');

    // --- Emit socket.io event after COMMIT ---
    const orderForKDS = {
      order_id: newOrder.order_id,
      created_at: newOrder.created_at,
      stall_id: stall_id,
      customer_display_name: wallet.visitor_name || wallet.visitor_phone,
      total_amount: calculatedTotal,
      order_status: 'PENDING',
      payment_type: 'TOKEN',
      items: validatedItems,
      visitor_phone: wallet.visitor_phone,
      membership_id: wallet.membership_id
    };
    req.io.to(stall_id).emit('new_order', orderForKDS);

    // 5. SUCCESS!
    res.status(201).json({
      message: 'Payment successful!',
      orderId: newOrder.order_id,
      new_balance: updatedWallet.current_balance
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('TRANSACTION FAILED:', err.message);
    
    if (err.message.includes('Insufficient funds') || err.message.includes('no longer available')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Payment failed. Please try again.' });
  } finally {
    client.release();
  }
});

// === 5. GET VISITOR'S TRANSACTION LOG (Secure) ===
router.get('/log', async (req, res) => {
  const wallet_id = req.wallet.wallet_id;

  try {
    const query = {
      text: `
        -- Section 1: Get all 'TOPUP' and 'REFUND' transactions
        SELECT
          cl.cash_ledger_id as id,
          cl.transaction_type,
          cl.amount,
          cl.created_at,
          c.cashier_name as details
        FROM cash_ledger cl
        LEFT JOIN cashiers c ON cl.cashier_id = c.cashier_id
        WHERE cl.wallet_id = $1

        UNION ALL

        -- Section 2: Get all 'PAYMENT' transactions
        SELECT
          t.transaction_id as id,
          'PAYMENT' as transaction_type,
          t.total_amount as amount,
          t.created_at,
          s.stall_name as details
        FROM transactions t
        JOIN orders o ON t.order_id = o.order_id
        JOIN stalls s ON o.stall_id = s.stall_id
        WHERE o.wallet_id = $1

        -- Combine and sort by date, newest first
        ORDER BY created_at DESC;
      `,
      values: [wallet_id]
    };

    const { rows } = await pool.query(query);
    res.status(200).json(rows);

  } catch (err) {
    console.error("Error fetching visitor log:", err.message);
    res.status(500).json({ error: 'Server error fetching log' });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Need bcrypt for PINs
const visitorAuthMiddleware = require('../middleware/visitorAuthMiddleware');

// === 1. VISITOR REGISTRATION (At Entrance - Generates PIN) ===
router.post('/register', async (req, res) => {
  const { visitor_phone, event_id, visitor_name } = req.body;
  if (!visitor_phone || !event_id) {
    return res.status(400).json({ error: 'Phone number and Event ID are required' });
  }

  try {
    // 1. Check if already registered
    const checkQuery = {
      text: 'SELECT wallet_id FROM wallets WHERE visitor_phone = $1 AND event_id = $2',
      values: [visitor_phone, event_id]
    };
    const checkResult = await pool.query(checkQuery);
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'This phone number is already registered for this event.' });
    }

    // 2. Generate a 6-digit PIN
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(rawPin, salt);

    // 3. Create Wallet with PIN
    const insertQuery = {
      text: `
        INSERT INTO wallets (event_id, visitor_phone, pin_hash, status, visitor_name)
        VALUES ($1, $2, $3, 'ACTIVE', $4)
        RETURNING wallet_id, visitor_phone, visitor_name
      `,
      values: [event_id, visitor_phone, pinHash, visitor_name || 'Guest']
    };
    const { rows: [newWallet] } = await pool.query(insertQuery);

    // 4. Return the RAW PIN once (user must remember it!)
    res.status(201).json({
      message: 'Registration successful',
      wallet: newWallet,
      pin: rawPin // ONLY time this is shown
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// === 2. VISITOR LOGIN (At Stalls - Requires PIN) ===
router.post('/login', async (req, res) => {
  const { visitor_phone, event_id, pin } = req.body; // Added 'pin'
  if (!visitor_phone || !event_id || !pin) {
    return res.status(400).json({ error: 'Phone, Event ID, and 6-digit PIN are required' });
  }

  try {
    // 1. Fetch wallet and branding info
    const query = {
      text: `
        SELECT w.*, e.event_name, o.club_name, o.logo_url as club_logo_url, o.url_slug
        FROM wallets w
        JOIN events e ON w.event_id = e.event_id
        JOIN organizers o ON e.organizer_id = o.organizer_id
        WHERE w.visitor_phone = $1 AND w.event_id = $2 AND w.status = 'ACTIVE'
      `,
      values: [visitor_phone, event_id]
    };
    const { rows: [wallet] } = await pool.query(query);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found. Please register at the entrance.' });
    }

    // 2. Verify PIN
    const isMatch = await bcrypt.compare(pin, wallet.pin_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid PIN.' });
    }

    // 3. Generate Token
    const payload = {
      visitor: {
        wallet_id: wallet.wallet_id,
        event_id: wallet.event_id,
        phone: wallet.visitor_phone,
        event_name: wallet.event_name,
        club_name: wallet.club_name,
        club_logo_url: wallet.club_logo_url,
        url_slug: wallet.url_slug
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, 
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

// --- All routes below this are protected (Unchanged) ---
router.use(visitorAuthMiddleware);

router.get('/me', (req, res) => {
  res.status(200).json({
    ...req.wallet,
    event_name: req.visitor.event_name,
    club_name: req.visitor.club_name,
    club_logo_url: req.visitor.club_logo_url
  });
});

router.get('/stall/:stall_id/menu', async (req, res) => {
  const { stall_id } = req.params;
  try {
    const stallQuery = pool.query('SELECT stall_name, description, logo_url FROM stalls WHERE stall_id = $1', [stall_id]);
    const menuQuery = pool.query(
      "SELECT item_id, item_name, description, price, is_veg, is_spicy, allergens, image_url FROM menu_items WHERE stall_id = $1 AND is_available = true ORDER BY item_name",
      [stall_id]
    );
    const [stallResult, menuResult] = await Promise.all([stallQuery, menuQuery]);
    if (stallResult.rows.length === 0) return res.status(404).json({ error: 'Stall not found' });
    res.status(200).json({ stall: stallResult.rows[0], menu_items: menuResult.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching menu' });
  }
});

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

        const { rows: [stall] } = await client.query('SELECT commission_rate FROM stalls WHERE stall_id = $1', [stall_id]);
        const commission_rate = parseFloat(stall.commission_rate);
        const organizer_share = calculatedTotal * commission_rate;
        const stall_share = calculatedTotal - organizer_share;

        await client.query('BEGIN');

        const { rows: [updatedWallet] } = await client.query(
        "UPDATE wallets SET current_balance = current_balance - $1 WHERE wallet_id = $2 AND current_balance >= $1 RETURNING current_balance",
        [calculatedTotal, wallet.wallet_id]
        );

        if (!updatedWallet) {
        throw new Error('Insufficient funds. Please top-up your wallet.');
        }

        const { rows: [newOrder] } = await client.query(
        `INSERT INTO orders (event_id, stall_id, wallet_id, total_amount, order_status, payment_type)
        VALUES ($1, $2, $3, $4, 'PENDING', 'TOKEN') RETURNING order_id, created_at`,
        [event_id, stall_id, wallet.wallet_id, calculatedTotal]
        );

        const itemInsertPromises = validatedItems.map(item => {
        return client.query(
            `INSERT INTO order_items (order_id, item_id, item_name, quantity, price_per_item)
            VALUES ($1, $2, $3, $4, $5)`,
            [newOrder.order_id, item.item_id, item.item_name, item.quantity, item.price]
        );
        });
        await Promise.all(itemInsertPromises);

        await client.query(
        `INSERT INTO transactions (order_id, total_amount, commission_rate, organizer_share, stall_share)
        VALUES ($1, $2, $3, $4, $5)`,
        [newOrder.order_id, calculatedTotal, commission_rate, organizer_share, stall_share]
        );

        await client.query('COMMIT');

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

router.get('/log', async (req, res) => {
  const wallet_id = req.wallet.wallet_id;
  try {
    const query = {
      text: `
        SELECT cl.cash_ledger_id as id, cl.transaction_type as type, cl.amount, cl.created_at, NULL as stall_name, '[]'::json as items
        FROM cash_ledger cl WHERE cl.wallet_id = $1
        UNION ALL
        SELECT o.order_id as id, 'PURCHASE' as type, o.total_amount as amount, o.created_at, s.stall_name,
          (SELECT json_agg(json_build_object('name', oi.item_name, 'qty', oi.quantity)) FROM order_items oi WHERE oi.order_id = o.order_id) as items
        FROM orders o JOIN stalls s ON o.stall_id = s.stall_id WHERE o.wallet_id = $1
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

const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const visitorAuthMiddleware = require('../middleware/visitorAuthMiddleware');

// === 1. VISITOR REGISTRATION (USER-SET PIN) ===
// This is the updated endpoint to match your new registration page.
router.post('/register', async (req, res) => {
  const { visitor_phone, event_id, visitor_name, pin, membership_id } = req.body;

  // --- Validation ---
  if (!visitor_phone || !event_id || !pin) {
    return res.status(400).json({ error: 'Phone number, Event ID, and PIN are required' });
  }
  if (pin.length !== 6) {
    return res.status(400).json({ error: 'PIN must be 6 digits' });
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

    // 2. Hash the user-provided PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    // 3. Create Wallet with user's PIN and optional info
    const insertQuery = {
      text: `
        INSERT INTO wallets (event_id, visitor_phone, pin_hash, status, visitor_name, membership_id)
        VALUES ($1, $2, $3, 'ACTIVE', $4, $5)
        RETURNING wallet_id, visitor_phone, visitor_name, membership_id
      `,
      values: [event_id, visitor_phone, pinHash, visitor_name || null, membership_id || null]
    };
    const { rows: [newWallet] } = await pool.query(insertQuery);

    // 4. Return success message (NO PIN IS RETURNED)
    res.status(201).json({
      message: 'Registration successful',
      wallet: newWallet
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// === 2. VISITOR LOGIN (Phone or Member ID) ===
// This is the updated login endpoint to handle both phone and member ID.
router.post('/login', async (req, res) => {
  const { loginType, identifier, pin, event_id } = req.body;

  if (!identifier || !pin || !event_id || !loginType) {
    return res.status(400).json({ error: 'Identifier, PIN, Event ID, and Login Type are required' });
  }

  try {
    let queryText = `
      SELECT w.*, e.event_name, o.club_name, o.logo_url as club_logo_url, o.url_slug
      FROM wallets w
      JOIN events e ON w.event_id = e.event_id
      JOIN organizers o ON e.organizer_id = o.organizer_id
      WHERE w.event_id = $2 AND w.status = 'ACTIVE' AND 
    `;
    
    // --- Dynamic Query ---
    if (loginType === 'member') {
      queryText += 'w.membership_id = $1';
    } else {
      // Default to phone
      queryText += 'w.visitor_phone = $1';
    }

    const query = {
      text: queryText,
      values: [identifier, event_id]
    };

    const { rows: [wallet] } = await pool.query(query);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found. Please register first.' });
    }

    // 2. Verify PIN
    const isMatch = await bcrypt.compare(pin, wallet.pin_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid PIN.' });
    }

    // 3. Generate Token (Payload is unchanged, already contains branding)
    const payload = {
      visitor: {
        wallet_id: wallet.wallet_id,
        event_id: wallet.event_id,
        phone: wallet.visitor_phone,
        event_name: wallet.event_name,
        club_name: wallet.club_name,
        club_logo_url: wallet.club_logo_url,
        url_slug: wallet.url_slug,
        membership_id: wallet.membership_id // Add membership_id to token
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

// --- All routes below this are protected ---
router.use(visitorAuthMiddleware);

// GET /api/visitor/me
// No change needed.
router.get('/me', (req, res) => {
  res.status(200).json({
    ...req.wallet,
    ...req.visitor
  });
});

// GET /api/visitor/stall/:stall_id/menu
// No change needed. This route correctly respects `is_available = true`.
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

// POST /api/visitor/stall/:stall_id/pay
// --- UPDATED to handle inventory checks and decrementing ---
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
        // --- 1. PRE-TRANSACTION CHECK (Check availability & stock) ---
        const itemIds = items.map(item => item.item_id);
        const priceCheckQuery = {
        // --- UPDATED to fetch inventory fields ---
        text: `
            SELECT item_id, item_name, price, is_available, track_inventory, stock_quantity 
            FROM menu_items 
            WHERE item_id = ANY($1::uuid[]) AND stall_id = $2
        `,
        values: [itemIds, stall_id]
        };
        const { rows: dbItems } = await client.query(priceCheckQuery);

        let calculatedTotal = 0;
        const validatedItems = [];

        for (const cartItem of items) {
            const dbItem = dbItems.find(i => i.item_id === cartItem.item_id);
            // Check if item exists and is marked as available
            if (!dbItem || !dbItem.is_available) {
                throw new Error(`'${dbItem?.item_name || 'An item'}' is no longer available. Please refresh your menu.`);
            }
            
            // --- NEW: INVENTORY CHECK ---
            if (dbItem.track_inventory) {
                if (parseInt(dbItem.stock_quantity, 10) < parseInt(cartItem.quantity, 10)) {
                    throw new Error(`Not enough stock for '${dbItem.item_name}'. Only ${dbItem.stock_quantity} left.`);
                }
            }
            
            calculatedTotal += parseFloat(dbItem.price) * parseInt(cartItem.quantity, 10);
            validatedItems.push({
                ...cartItem,
                item_name: dbItem.item_name,
                price: parseFloat(dbItem.price),
                track_inventory: dbItem.track_inventory // Pass this along
            });
        }

        // Check wallet balance
        if (parseFloat(wallet.current_balance) < calculatedTotal) {
            throw new Error('Insufficient funds. Please top-up your wallet.');
        }

        // --- 2. START DATABASE TRANSACTION ---
        await client.query('BEGIN');

        // 3. Decrement wallet balance
        const { rows: [updatedWallet] } = await client.query(
            "UPDATE wallets SET current_balance = current_balance - $1 WHERE wallet_id = $2 AND current_balance >= $1 RETURNING current_balance",
            [calculatedTotal, wallet.wallet_id]
        );

        if (!updatedWallet) {
            throw new Error('Insufficient funds. Please top-up your wallet.');
        }

        // 4. Create the Order
        const { rows: [newOrder] } = await client.query(
            `INSERT INTO orders (event_id, stall_id, wallet_id, total_amount, order_status, payment_type)
            VALUES ($1, $2, $3, $4, 'PENDING', 'TOKEN') RETURNING order_id, created_at`,
            [event_id, stall_id, wallet.wallet_id, calculatedTotal]
        );

        // 5. Insert order items AND Decrement Stock
        const itemUpdatePromises = validatedItems.map(item => {
            // Promise 1: Insert the order item
            const insertItemPromise = client.query(
                `INSERT INTO order_items (order_id, item_id, item_name, quantity, price_per_item)
                VALUES ($1, $2, $3, $4, $5)`,
                [newOrder.order_id, item.item_id, item.item_name, item.quantity, item.price]
            );

            const promises = [insertItemPromise];

            // --- NEW: Promise 2 (Conditional): Decrement stock ---
            if (item.track_inventory) {
                const updateStockPromise = client.query(
                  `
                    UPDATE menu_items 
                    SET 
                      stock_quantity = stock_quantity - $1,
                      -- Automatically set to unavailable if stock runs out
                      is_available = CASE 
                        WHEN (stock_quantity - $1) <= 0 THEN false
                        ELSE is_available 
                      END
                    WHERE item_id = $2 AND track_inventory = true
                  `,
                  [item.quantity, item.item_id]
                );
                promises.push(updateStockPromise);
            }
            
            return Promise.all(promises);
        });
        
        await Promise.all(itemUpdatePromises);

        // 6. Get commission rate and create financial transaction record
        const { rows: [stall] } = await client.query('SELECT commission_rate FROM stalls WHERE stall_id = $1', [stall_id]);
        const commission_rate = parseFloat(stall.commission_rate);
        const organizer_share = calculatedTotal * commission_rate;
        const stall_share = calculatedTotal - organizer_share;

        await client.query(
            `INSERT INTO transactions (order_id, total_amount, commission_rate, organizer_share, stall_share)
            VALUES ($1, $2, $3, $4, $5)`,
            [newOrder.order_id, calculatedTotal, commission_rate, organizer_share, stall_share]
        );

        // --- 7. COMMIT TRANSACTION ---
        await client.query('COMMIT');

        // 8. Emit to KDS (after commit)
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
        // Send specific, user-friendly errors
        if (err.message.includes('Insufficient funds') || err.message.includes('no longer available') || err.message.includes('Not enough stock')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Payment failed. Please try again.' });
    } finally {
        client.release();
    }
});

// GET /api/visitor/log
// No change needed.
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

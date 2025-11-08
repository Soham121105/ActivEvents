const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cashierAuthMiddleware = require('../middleware/cashierAuthMiddleware');

/**
 * [POST] /api/cashier/login
 * UPDATED: Now requires event_id
 */
router.post('/login', async (req, res) => {
  const { cashier_name, pin, event_id } = req.body; // <-- ADD event_id
  
  if (!cashier_name || !pin || !event_id) {
    return res.status(400).json({ error: 'Event, Cashier Name, and PIN are required' });
  }

  try {
    // 1. Find the cashier for THIS SPECIFIC EVENT
    const query = {
      text: 'SELECT * FROM Cashiers WHERE cashier_name = $1 AND event_id = $2 AND is_active = true',
      values: [cashier_name, event_id],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials for this event' });
    }
    const cashier = result.rows[0];

    // 2. Check the PIN
    const isMatch = await bcrypt.compare(pin, cashier.pin_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. THIS IS THE "SMART" PART
    // We create a token that includes the cashier_id AND the event_id
    const payload = {
      cashier: {
        id: cashier.cashier_id,
        name: cashier.cashier_name,
        event_id: cashier.event_id // This is the magic!
      }
    };

    // 4. Sign and send the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, cashier: payload.cashier }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// --- All routes below this line are protected by our new gatekeeper ---
router.use(cashierAuthMiddleware);

/**
 * [POST] /api/cashier/check-balance
 * Checks the balance of a visitor's wallet for the cashier's event
 */
router.post('/check-balance', async (req, res) => {
  const { visitor_phone } = req.body;
  const event_id = req.cashier.event_id; // Get event_id from the secure token

  if (!visitor_phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const query = {
      text: "SELECT current_balance FROM Wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE'",
      values: [event_id, visitor_phone],
    };
    const { rows: [wallet] } = await pool.query(query);

    if (!wallet) {
      return res.status(200).json({ current_balance: 0 });
    }

    res.status(200).json({ current_balance: wallet.current_balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while checking balance' });
  }
});

/**
 * [GET] /api/cashier/log
 * Fetches the personal transaction log for the logged-in cashier
 */
router.get('/log', async (req, res) => {
  const cashier_id = req.cashier.id;

  try {
    const query = {
      text: `
        SELECT 
          cl.cash_ledger_id, 
          cl.transaction_type, 
          cl.amount, 
          cl.created_at,
          w.visitor_phone
        FROM Cash_Ledger cl
        JOIN Wallets w ON cl.wallet_id = w.wallet_id
        WHERE cl.cashier_id = $1
        ORDER BY cl.created_at DESC;
      `,
      values: [cashier_id],
    };

    const { rows } = await pool.query(query);
    res.status(200).json(rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error fetching transaction log' });
  }
});


/**
 * [POST] /api/cashier/topup
 * Creates or "tops-up" a visitor's digital wallet
 */
router.post('/topup', async (req, res) => {
  const { visitor_phone, amount, visitor_name, membership_id } = req.body;
  
  const cashier_id = req.cashier.id;
  const event_id = req.cashier.event_id;
  
  if (!visitor_phone || !amount) {
    return res.status(400).json({ error: 'Phone and amount are required' });
  }
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const walletQuery = {
      text: `
        INSERT INTO Wallets (event_id, visitor_phone, current_balance, status, visitor_name, membership_id)
        VALUES ($1, $2, $3, 'ACTIVE', $4, $5)
        ON CONFLICT (event_id, visitor_phone)
        DO UPDATE SET
          current_balance = Wallets.current_balance + $3,
          visitor_name = $4,
          membership_id = $5
        RETURNING *;
      `,
      values: [event_id, visitor_phone, amount, visitor_name || null, membership_id || null],
    };
    const { rows: [updatedWallet] } = await client.query(walletQuery);

    const ledgerQuery = {
      text: `
        INSERT INTO Cash_Ledger (wallet_id, cashier_id, transaction_type, amount)
        VALUES ($1, $2, 'TOPUP', $3)
        RETURNING cash_ledger_id;
      `,
      values: [updatedWallet.wallet_id, cashier_id, amount],
    };
    const { rows: [ledgerEntry] } = await client.query(ledgerQuery);

    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Top-up successful',
      transaction_id: ledgerEntry.cash_ledger_id,
      new_balance: updatedWallet.current_balance,
      visitor_phone: updatedWallet.visitor_phone
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error during top-up' });
  } finally {
    client.release();
  }
});

/**
 * [POST] /api/cashier/refund
 * Refunds a visitor's remaining balance
 */
router.post('/refund', async (req, res) => {
  const { visitor_phone } = req.body;
  const cashier_id = req.cashier.id;
  const event_id = req.cashier.event_id;

  if (!visitor_phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const getWalletQuery = {
      text: "SELECT * FROM Wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE' FOR UPDATE",
      values: [event_id, visitor_phone],
    };
    const { rows: [wallet] } = await client.query(getWalletQuery);

    if (!wallet) {
      return res.status(44).json({ error: 'Active wallet not found' });
    }

    const refundAmount = parseFloat(wallet.current_balance);
    if (refundAmount <= 0) {
      return res.status(400).json({ error: 'Wallet has no balance to refund' });
    }

    const updateWalletQuery = {
      text: "UPDATE Wallets SET current_balance = 0, status = 'ENDED' WHERE wallet_id = $1",
      values: [wallet.wallet_id],
    };
    await client.query(updateWalletQuery);

    const ledgerQuery = {
      text: `
        INSERT INTO Cash_Ledger (wallet_id, cashier_id, transaction_type, amount)
        VALUES ($1, $2, 'REFUND', $3)
        RETURNING cash_ledger_id;
      `,
      values: [wallet.wallet_id, cashier_id, refundAmount],
    };
    const { rows: [ledgerEntry] } = await client.query(ledgerQuery);

    await client.query('COMMIT');
    res.status(200).json({ 
      message: 'Refund successful', 
      refundedAmount: refundAmount,
      transaction_id: ledgerEntry.cash_ledger_id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server error during refund' });
  } finally {
    client.release();
  }
});

module.exports = router;
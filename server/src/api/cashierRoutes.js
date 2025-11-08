const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cashierAuthMiddleware = require('../middleware/cashierAuthMiddleware');

/**
 * [POST] /api/cashier/login
 * This is our new "SMART LOGIN" for Cashiers
 */
router.post('/login', async (req, res) => {
  const { cashier_name, pin } = req.body;
  if (!cashier_name || !pin) {
    return res.status(400).json({ error: 'Cashier name and PIN are required' });
  }

  try {
    // 1. Find the cashier by their name
    const query = {
      text: 'SELECT * FROM Cashiers WHERE cashier_name = $1 AND is_active = true',
      values: [cashier_name],
    };
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
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
 * [POST] /api/cashier/topup
 * Creates or "tops-up" a visitor's digital wallet
 * This is now "smart" - it gets the event_id from the token
 */
router.post('/topup', async (req, res) => {
  // 1. Get data from the request
  const { visitor_phone, amount } = req.body;
  
  // 2. Get cashier_id and event_id from the SECURE TOKEN
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

    // 3. Find or Create the Wallet (Upsert)
    // This is now robust and uses the event_id from the token
    const walletQuery = {
      text: `
        INSERT INTO Wallets (event_id, visitor_phone, current_balance, status)
        VALUES ($1, $2, $3, 'ACTIVE')
        ON CONFLICT (event_id, visitor_phone)
        DO UPDATE SET
          current_balance = Wallets.current_balance + $3
        RETURNING *;
      `,
      values: [event_id, visitor_phone, amount],
    };
    const { rows: [updatedWallet] } = await client.query(walletQuery);

    // 4. Log this transaction in the Cash_Ledger
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
    
    // 5. Send back a robust success message
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
 * This is also "smart" and uses the event_id from the token
 */
router.post('/refund', async (req, res) => {
  const { visitor_phone } = req.body; // We only need the phone
  const cashier_id = req.cashier.id;
  const event_id = req.cashier.event_id; // Get from token

  if (!visitor_phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get the current balance and lock the row
    const getWalletQuery = {
      text: "SELECT * FROM Wallets WHERE event_id = $1 AND visitor_phone = $2 AND status = 'ACTIVE' FOR UPDATE",
      values: [event_id, visitor_phone],
    };
    const { rows: [wallet] } = await client.query(getWalletQuery);

    if (!wallet) {
      return res.status(404).json({ error: 'Active wallet not found' });
    }

    const refundAmount = parseFloat(wallet.current_balance);
    if (refundAmount <= 0) {
      return res.status(400).json({ error: 'Wallet has no balance to refund' });
    }

    // 2. Update wallet: set balance to 0 and status to 'ENDED'
    const updateWalletQuery = {
      text: "UPDATE Wallets SET current_balance = 0, status = 'ENDED' WHERE wallet_id = $1",
      values: [wallet.wallet_id],
    };
    await client.query(updateWalletQuery);

    // 3. Log the refund
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

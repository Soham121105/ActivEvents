const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// This middleware verifies a visitor's token, finds their wallet,
// and attaches the wallet to the request object.
module.exports = async function(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // 1. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Check if it's a 'visitor' token
    if (!decoded.visitor) {
      return res.status(403).json({ error: 'Access denied: Not a Visitor token' });
    }

    // 3. This is the "Smart" part:
    // We pre-fetch the visitor's wallet using the IDs from the token.
    const query = {
      text: "SELECT * FROM Wallets WHERE wallet_id = $1 AND event_id = $2 AND status = 'ACTIVE'",
      values: [decoded.visitor.wallet_id, decoded.visitor.event_id]
    };
    const { rows: [wallet] } = await pool.query(query);

    if (!wallet) {
      return res.status(404).json({ error: 'Active wallet not found. You may have been refunded.' });
    }

    // 4. Attach the full, current wallet object to the request
    req.wallet = wallet; 
    
    next();

  } catch (err) {
    console.error('Visitor token verification failed:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

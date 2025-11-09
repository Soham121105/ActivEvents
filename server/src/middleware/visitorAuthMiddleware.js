const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async function(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token is not valid' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.visitor) return res.status(403).json({ error: 'Access denied' });

    // Attach visitor info from token (contains branding now)
    req.visitor = decoded.visitor;

    // Fetch full wallet for latest balance
    const query = {
      text: "SELECT * FROM wallets WHERE wallet_id = $1 AND status = 'ACTIVE'",
      values: [decoded.visitor.wallet_id]
    };
    const { rows: [wallet] } = await pool.query(query);

    if (!wallet) return res.status(404).json({ error: 'Active wallet not found.' });

    req.wallet = wallet;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is invalid or expired' });
  }
};
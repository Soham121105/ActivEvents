const jwt = require('jsonwebtoken');

// This is our "gatekeeper" function FOR CASHIERS
module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // We verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // CRITICAL: We check if this token is a 'cashier' token
    // If it's a stall owner's token, we reject it.
    if (!decoded.cashier) {
      return res.status(403).json({ error: 'Access denied: Not a Cashier' });
    }

    // We attach the 'cashier' info (which includes the event_id)
    // to the request object.
    req.cashier = decoded.cashier; 
    
    next(); // Continue to the 'topup' or 'refund' function

  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

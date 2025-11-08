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
    if (!decoded.cashier) {
      return res.status(403).json({ error: 'Access denied: Not a Cashier' });
    }

    // We attach the 'cashier' info
    req.cashier = decoded.cashier; 
    
    next(); 

  } catch (err) {
    console.error('Token verification failed:', err.message);
    // --- THIS IS THE FIX ---
    // We must RETURN after sending the error to stop execution
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

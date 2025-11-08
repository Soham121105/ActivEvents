const jwt = require('jsonwebtoken');

// This is our "gatekeeper" function FOR STALLS
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- THIS IS THE CRITICAL FIX ---
    // We must check if this is a stall token.
    // If it's a cashier or visitor token, reject it.
    if (!decoded.stall) {
      return res.status(403).json({ error: 'Access denied: Not a Stall Owner token' });
    }
    // --- END OF FIX ---

    // Now we know decoded.stall exists
    req.stall = decoded.stall; 
    
    next(); 

  } catch (err) {
    console.error('Token verification failed:', err.message);
    // This return is also critical
    return res.status(401).json({ error: 'Token is not valid' });
  }
};
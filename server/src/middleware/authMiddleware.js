const jwt = require('jsonwebtoken');
// We have REMOVED the "require('dotenv').config()" line.
// This is correct, because 'server.js' already loaded it.

// This is our "gatekeeper" function
module.exports = function(req, res, next) {
  // 1. Get the token from the request header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // 2. Check if the token is valid
  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // 3. Verify the token
    // This will now work, because process.env.JWT_SECRET was loaded by server.js
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the 'stall' info to the request
    req.stall = decoded.stall; 
    
    // 5. Continue
    next(); 

  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

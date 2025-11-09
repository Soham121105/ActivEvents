const jwt = require('jsonwebtoken');

// This is our "gatekeeper" function FOR ORGANIZERS (ADMINS)
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

    // CRITICAL: We check if this token is an 'organizer' token
    if (!decoded.organizer) {
      return res.status(403).json({ error: 'Access denied: Not an Organizer token' });
    }

    // We attach the 'organizer' info (id, name, logo_url)
    req.organizer = decoded.organizer; 
    
    next(); 

  } catch (err) {
    console.error('Admin token verification failed:', err.message);
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

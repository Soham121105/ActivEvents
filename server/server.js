// 1. Load .env AT THE VERY TOP, ONLY ONCE
require('dotenv').config(); 

// 2. Import modules
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db'); // Import our pool

// 3. Import all our API routes
// This is our new, robust structure
const eventRoutes = require('./src/api/eventRoutes');   // For Admins
const stallRoutes = require('./src/api/stallRoutes');   // For Stalls
const menuRoutes = require('./src/api/menuRoutes');     // For Stalls (secure)
const cashierRoutes = require('./src/api/cashierRoutes'); // For Cashiers
// (We will add orderRoutes here later)

// 4. Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// 5. Setup Middleware
app.use(cors());
app.use(express.json());

// 6. Setup Our API Routes
// All Admin routes will be on '/api/events'
app.use('/api/events', eventRoutes); 

// All Stall routes (login, menu) will be on '/api/stalls'
app.use('/api/stalls', stallRoutes); 
app.use('/api/menu', menuRoutes); 

// All Cashier routes (login, topup) will be on '/api/cashier'
app.use('/api/cashier', cashierRoutes); 

// 7. Start the server
console.log("Attempting to connect to database...");

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('--- DATABASE CONNECTION FAILED! ---');
    console.error('Check your .env file or AWS security group.');
    console.error(err);
  } else {
    console.log(`✅ Connected to PostgreSQL database: ${res.rows[0].now}`);
    
    // Now that the DB is connected, start the server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  }
});

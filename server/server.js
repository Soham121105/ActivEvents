// 1. Load .env AT THE VERY TOP, ONLY ONCE
require('dotenv').config(); 

// 2. Import modules
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db'); // Import our pool

// 3. Import all our API routes
const eventRoutes = require('./src/api/eventRoutes');
const stallRoutes = require('./src/api/stallRoutes');
const menuRoutes = require('./src/api/menuRoutes');
const cashierRoutes = require('./src/api/cashierRoutes');
const visitorRoutes = require('./src/api/visitorRoutes'); // This was already here
const orderRoutes = require('./src/api/orderRoutes');

// 4. Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// 5. Setup Middleware
app.use(cors());
app.use(express.json());

// 6. Setup Our API Routes
app.use('/api/events', eventRoutes); 
app.use('/api/stalls', stallRoutes); 
app.use('/api/menu', menuRoutes); 
app.use('/api/cashier', cashierRoutes); 
app.use('/api/orders', orderRoutes);

// --- THIS IS THE FIX ---
// This line was missing, which caused all visitor payments to fail.
app.use('/api/visitor', visitorRoutes);
// --- END OF FIX ---

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
// 1. Load .env AT THE VERY TOP, ONLY ONCE
require('dotenv').config(); 

// 2. Import modules
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db'); // Import our pool

// --- NEW SOCKET.IO IMPORTS ---
const http = require('http'); // We need the http module
const { Server } = require("socket.io"); // Import Server from socket.io

// 3. Import all our API routes
const eventRoutes = require('./src/api/eventRoutes');
const stallRoutes = require('./src/api/stallRoutes');
const menuRoutes = require('./src/api/menuRoutes');
const cashierRoutes = require('./src/api/cashierRoutes');
const visitorRoutes = require('./src/api/visitorRoutes');
const orderRoutes = require('./src/api/orderRoutes');

// 4. Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// --- NEW: Create HTTP server and Socket.io server ---
const server = http.createServer(app); // Create an HTTP server from our Express app
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow your React app's origin
    methods: ["GET", "POST"]
  }
});

// 5. Setup Middleware
app.use(cors());
app.use(express.json());

// --- NEW: Middleware to attach 'io' to every request ---
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 6. Setup Our API Routes
app.use('/api/events', eventRoutes); 
app.use('/api/stalls', stallRoutes); 
app.use('/api/menu', menuRoutes); 
app.use('/api/cashier', cashierRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/visitor', visitorRoutes);

// --- NEW: Socket.io connection listener ---
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  // Join a room based on stall_id
  socket.on('join_stall_room', (stallId) => {
    socket.join(stallId);
    console.log(`Socket ${socket.id} joined room for stall ${stallId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});


// 7. Start the server
console.log("Attempting to connect to database...");

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('--- DATABASE CONNECTION FAILED! ---');
    console.error('Check your .env file or AWS security group.');
    console.error(err);
  } else {
    console.log(`✅ Connected to PostgreSQL database: ${res.rows[0].now}`);
    
    // --- UPDATED: Use server.listen instead of app.listen ---
    server.listen(PORT, () => {
      console.log(`✅ Server (with Socket.io) is running on http://localhost:${PORT}`);
    });
  }
});

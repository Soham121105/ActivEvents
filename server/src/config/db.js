// This file is now our single source of truth for the database connection.
// We tell 'dotenv' to look two folders up (out of 'config', out of 'src')
// to find the .env file in the 'server' root.
require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  // These values are read from your .env file
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,

  // --- This is the critical SSL fix for AWS RDS ---
  ssl: {
    rejectUnauthorized: false
  },
  // ----------------------------------------------

  // --- Connection Pool Settings ---
  max: 20, // Max number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client can be idle

  // --- This is the 30-second connection timeout fix ---
  connectionTimeoutMillis: 30000, 
});

// We export the 'pool' object so our other files (like eventRoutes.js) can use it.
module.exports = pool;

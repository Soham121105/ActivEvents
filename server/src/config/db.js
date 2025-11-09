const { Pool } = require('pg');

// Validates that .env is loaded
if (!process.env.DB_HOST) {
  console.error("FATAL ERROR: DB_HOST is missing. .env file not loaded correctly.");
  process.exit(1); // Stop the server immediately if env is missing
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, 
});

module.exports = pool;

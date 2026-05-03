const { Pool } = require('pg');

// 🔥 Always use Railway DATABASE_URL (no fallback)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Railway
  },
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL (Railway)');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

// Query helper
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

module.exports = {
  query,
  pool,
};
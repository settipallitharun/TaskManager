const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function initDatabase() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('✅ Database schema ready');
  } catch (err) {
    // IF NOT EXISTS means this is safe to re-run — log but don't crash
    console.error('⚠️  Schema init warning:', err.message);
  }
}

module.exports = initDatabase;

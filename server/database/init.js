const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema ready');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
}

module.exports = initDatabase;

require('dotenv').config({ path: './.env' });
const { query } = require('./database/connection');
const sql = `
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Member')),
    added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
`;
query(sql).then(() => {
    console.log('TEAM MEMBERS TABLE CREATED');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});

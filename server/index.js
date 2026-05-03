const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const initDatabase = require('./database/init');

const app = express();

app.use(
  cors({
    origin: '*',
    credentials: false,
  })
);
app.use(express.json());

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const teamRoutes = require('./routes/team');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team', teamRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HAS_JWT_SECRET: !!process.env.JWT_SECRET,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_DB_HOST: !!process.env.DB_HOST,
  });
});
// Serve frontend
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});



const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is missing — auth will fail.');
  }
  await initDatabase();
});

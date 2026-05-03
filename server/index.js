const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || true : true,
    credentials: true,
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
// Serve frontend
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});



const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is missing in server/.env — auth will fail.');
  }
});

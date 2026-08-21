/**
 * Club Website — Backend Server
 * ==============================
 * Express.js API server with modular route/controller/service architecture.
 * Uses mock data (no external database) for Phase 1.
 */

const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const { errorHandler } = require('./src/middleware/errorHandler');
const { requireAdmin } = require('./src/middleware/auth');
const attendanceController = require('./src/controllers/attendanceController');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const contributionRoutes = require('./src/routes/contributionRoutes');
const engagementRoutes = require('./src/routes/engagementRoutes');
const path = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/engagement', engagementRoutes);

// Activity-scoped attendance routes (admin only)
app.get('/api/activities/:id/attendance', requireAdmin, attendanceController.getActivityAttendance);
app.patch('/api/activities/:id/attendance', requireAdmin, attendanceController.updateActivityAttendance);

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🚀 Club Website API running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}\n`);
});

module.exports = app;

/**
 * PPC Portal — Serverless API Server (Vercel)
 * ============================================
 * Express.js server running as a Vercel Serverless Function.
 */

const express = require('express');
const cors = require('cors');
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

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PPC Portal API',
    mode: 'Vercel Serverless'
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PPC Portal API is active',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Member's own attendance
router.get('/me', requireAuth, attendanceController.getMyAttendance);

// Admin: view/update attendance for a specific activity
// Note: these routes use /activities/:id/attendance pattern
// They are mounted under /api/attendance but also need activity-specific routes
// The activity-specific routes are mounted in server.js

module.exports = router;

// Export controller for activity-scoped attendance routes
module.exports.attendanceController = attendanceController;

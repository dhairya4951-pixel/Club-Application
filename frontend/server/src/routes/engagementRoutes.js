/**
 * Engagement Routes
 * =================
 * Auto-calculated engagement metrics.
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/engagementController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Own engagement
router.get('/me', requireAuth, controller.getMyEngagement);

// All members (admin only)
router.get('/all', requireAdmin, controller.getAllEngagement);

// Specific member engagement
router.get('/member/:memberId', requireAuth, controller.getMemberEngagement);

// Timeline
router.get('/timeline/:memberId', requireAuth, controller.getTimeline);

module.exports = router;

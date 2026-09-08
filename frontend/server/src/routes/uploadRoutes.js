/**
 * Upload Routes
 * =============
 * Image upload endpoints with proper authorization.
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

// Profile image — any authenticated user (own account only)
router.post('/profile-image', requireAuth, handleUpload, uploadController.uploadProfileImage);
router.delete('/profile-image', requireAuth, uploadController.removeProfileImage);

// Activity image — admins only (teacher + leadership)
router.post('/activity-image', requireAdmin, handleUpload, uploadController.uploadActivityImage);

module.exports = router;

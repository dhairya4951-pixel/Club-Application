const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, profileController.getProfile);
router.patch('/', requireAuth, profileController.updateProfile);
router.patch('/password', requireAuth, profileController.changePassword);

module.exports = router;

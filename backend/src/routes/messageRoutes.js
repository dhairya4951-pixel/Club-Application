const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, messageController.getAll);
router.post('/', requireAuth, messageController.create);
router.delete('/:id', requireAdmin, messageController.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, messageController.getAll);
router.post('/', requireAuth, messageController.create);
router.patch('/:id', requireAuth, messageController.update);
router.delete('/:id', requireAuth, messageController.remove);

module.exports = router;

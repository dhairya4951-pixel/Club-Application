const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, activityController.getAll);
router.get('/upcoming', requireAuth, activityController.getUpcoming);
router.get('/past', requireAuth, activityController.getPast);
router.get('/:id', requireAuth, activityController.getById);
router.post('/', requireAdmin, activityController.create);
router.patch('/:id', requireAdmin, activityController.update);
router.delete('/:id', requireAdmin, activityController.remove);

module.exports = router;

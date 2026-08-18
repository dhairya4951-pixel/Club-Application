const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { requireAuth, requireAdmin, requireTeacher } = require('../middleware/auth');

// Any authenticated user can view members
router.get('/', requireAuth, memberController.getAll);
router.get('/leadership', requireAuth, memberController.getLeadershipStatus);
router.get('/:id', requireAuth, memberController.getById);

// Admin access (Teacher + Leadership students) for CRUD
router.post('/', requireAdmin, memberController.create);
router.patch('/:id', requireAdmin, memberController.update);
router.delete('/:id', requireAdmin, memberController.remove);

// Teacher-only: Position management
router.patch('/:id/position', requireTeacher, memberController.assignPosition);
router.delete('/:id/position', requireTeacher, memberController.removePosition);

module.exports = router;

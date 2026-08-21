/**
 * Contribution Routes
 * ===================
 * Admin-only CRUD for contribution records.
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/contributionController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public (auth only)
router.get('/types', requireAuth, controller.getTypes);
router.get('/member/:memberId', requireAuth, controller.getByMember);

// Admin only
router.get('/', requireAdmin, controller.getAll);
router.get('/:id', requireAdmin, controller.getById);
router.post('/', requireAdmin, controller.create);
router.patch('/:id', requireAdmin, controller.update);
router.delete('/:id', requireAdmin, controller.remove);
router.get('/:id/audit', requireAdmin, controller.getAuditLog);

module.exports = router;

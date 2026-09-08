/**
 * Message Controller
 * ==================
 * Handles discussion message CRUD with role-based permissions:
 *
 *   GET    /           — All authenticated users
 *   POST   /           — All authenticated users (create)
 *   PATCH  /:id        — Owner only (edit own message)
 *   DELETE /:id        — Owner OR admin (delete own or any)
 */

const messageService = require('../services/messageService');
const { validateCreateMessage, validateUpdateMessage } = require('../validators/messageValidator');
const { hasAdminAccess } = require('../models/User');

async function getAll(req, res, next) {
  try {
    const result = await messageService.getAllMessages();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validateCreateMessage(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = await messageService.createMessage(req.user.id, req.body.message);
    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /:id — Edit own message only.
 * Only the message owner can edit their message.
 */
async function update(req, res, next) {
  try {
    const errors = validateUpdateMessage(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    // Fetch the message to check ownership
    const existing = await messageService.getMessageById(req.params.id);
    if (existing.error) {
      return res.status(existing.status).json({ error: existing.error });
    }

    // Only the sender can edit their own message
    if (existing.data.senderId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const result = await messageService.updateMessage(req.params.id, req.body.message);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /:id — Delete own message OR admin can delete any message.
 * Permission logic:
 *   - Message owner → allowed
 *   - Admin (teacher, president, VP, gen sec) → allowed
 *   - Otherwise → 403
 */
async function remove(req, res, next) {
  try {
    // Fetch the message to check ownership
    const existing = await messageService.getMessageById(req.params.id);
    if (existing.error) {
      return res.status(existing.status).json({ error: existing.error });
    }

    const isOwner = existing.data.senderId === req.user.id;
    const isAdmin = hasAdminAccess(req.user);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    const result = await messageService.deleteMessage(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };

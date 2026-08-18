/**
 * Message Controller
 */

const messageService = require('../services/messageService');
const { validateCreateMessage } = require('../validators/messageValidator');

function getAll(req, res, next) {
  try {
    const result = messageService.getAllMessages();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const errors = validateCreateMessage(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = messageService.createMessage(req.user.id, req.body.message);
    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const result = messageService.deleteMessage(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, remove };

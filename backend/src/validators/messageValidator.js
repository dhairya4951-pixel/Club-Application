/**
 * Message Validators
 */

function validateCreateMessage(body) {
  const errors = [];

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    errors.push('Message content is required');
  }

  if (body.message && body.message.length > 2000) {
    errors.push('Message must be under 2000 characters');
  }

  return errors;
}

function validateUpdateMessage(body) {
  const errors = [];

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    errors.push('Message content is required');
  }

  if (body.message && body.message.length > 2000) {
    errors.push('Message must be under 2000 characters');
  }

  return errors;
}

module.exports = { validateCreateMessage, validateUpdateMessage };

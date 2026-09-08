/**
 * Activity Validators
 */

const { ACTIVITY_STATUS } = require('../models/Activity');

function validateCreateActivity(body) {
  const errors = [];

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    errors.push('Title is required (minimum 3 characters)');
  }

  if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 10) {
    errors.push('Description is required (minimum 10 characters)');
  }

  if (!body.date || typeof body.date !== 'string') {
    errors.push('Date is required');
  }

  if (!body.time || typeof body.time !== 'string') {
    errors.push('Time is required');
  }

  if (!body.location || typeof body.location !== 'string') {
    errors.push('Location is required');
  }

  if (body.status && !Object.values(ACTIVITY_STATUS).includes(body.status)) {
    errors.push(`Status must be one of: ${Object.values(ACTIVITY_STATUS).join(', ')}`);
  }

  return errors;
}

function validateUpdateActivity(body) {
  const errors = [];

  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 3)) {
    errors.push('Title must be at least 3 characters');
  }

  if (body.status !== undefined && !Object.values(ACTIVITY_STATUS).includes(body.status)) {
    errors.push(`Status must be one of: ${Object.values(ACTIVITY_STATUS).join(', ')}`);
  }

  return errors;
}

module.exports = { validateCreateActivity, validateUpdateActivity };

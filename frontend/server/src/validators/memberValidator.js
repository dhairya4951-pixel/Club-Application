/**
 * Member Validators
 */

const { ROLES, POSITIONS } = require('../models/User');

function validateCreateMember(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push('Name is required (minimum 2 characters)');
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    errors.push('Password is required (minimum 6 characters)');
  }

  // Position validation removed from create — positions are assigned separately by teacher only

  return errors;
}

function validateUpdateMember(body) {
  const errors = [];

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters');
  }

  if (body.email !== undefined && (typeof body.email !== 'string' || !body.email.includes('@'))) {
    errors.push('Valid email is required');
  }

  // Position and role changes are NOT allowed through the general update endpoint
  // They go through the dedicated /members/:id/position endpoint

  return errors;
}

function validatePositionAssignment(body) {
  const errors = [];
  const validPositions = Object.values(POSITIONS);

  if (!body.position || !validPositions.includes(body.position)) {
    errors.push(`Position must be one of: ${validPositions.join(', ')}`);
  }

  return errors;
}

module.exports = { validateCreateMember, validateUpdateMember, validatePositionAssignment };

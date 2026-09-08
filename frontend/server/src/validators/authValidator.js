/**
 * Auth Validators
 */

function validateLogin(body) {
  const errors = [];
  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.push('Email is required');
  }
  if (!body.password || typeof body.password !== 'string' || !body.password.trim()) {
    errors.push('Password is required');
  }
  return errors;
}

module.exports = { validateLogin };

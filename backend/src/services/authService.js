/**
 * Auth Service
 * ============
 * Handles authentication logic against mock data.
 *
 * SUPABASE MIGRATION:
 *   Replace bcrypt.compare + JWT signing with:
 *     supabase.auth.signInWithPassword({ email, password })
 *   Replace getCurrentUser with:
 *     supabase.auth.getUser(token) + profiles table lookup
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');

async function login(email, password) {
  const user = users.find(u => u.email === email);
  if (!user) {
    return { error: 'Invalid email or password', status: 401 };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { error: 'Invalid email or password', status: 401 };
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, position: user.position },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    data: {
      token,
      user: sanitizeUser(user),
    },
  };
}

function getCurrentUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) {
    return { error: 'User not found', status: 404 };
  }
  return { data: sanitizeUser(user) };
}

module.exports = { login, getCurrentUser };

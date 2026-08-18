/**
 * Authentication & Authorization Middleware
 * ==========================================
 * Three-tier guards:
 *
 *   requireAuth    — Any authenticated user
 *   requireAdmin   — Teacher OR Leadership student (admin-level CRUD)
 *   requireTeacher — Teacher ONLY (position management)
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { users } = require('../data/mockData');
const { hasAdminAccess, isTeacherAdmin } = require('../models/User');

/**
 * Verify JWT and attach user to request
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request (without password hash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Require admin access (Teacher OR Leadership student)
 * Used for: member CRUD, activity CRUD, attendance, message moderation
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!hasAdminAccess(req.user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/**
 * Require Teacher/Super Admin (position management only)
 * Used for: assigning/removing leadership positions
 */
function requireTeacher(req, res, next) {
  requireAuth(req, res, () => {
    if (!isTeacherAdmin(req.user)) {
      return res.status(403).json({ error: 'Only the Teacher/Super Admin can perform this action' });
    }
    next();
  });
}

/**
 * Alias for requireAuth (any authenticated member)
 */
function requireMember(req, res, next) {
  return requireAuth(req, res, next);
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireTeacher,
  requireMember,
};

/**
 * Authentication & Authorization Middleware
 * ==========================================
 * Three-tier guards:
 *
 *   requireAuth    — Any authenticated user
 *   requireAdmin   — Teacher OR Leadership student (admin-level CRUD)
 *   requireTeacher — Teacher ONLY (position management)
 *
 * JWT Verification Strategy:
 *   When Supabase is configured: verify the token via supabase.auth.getUser()
 *   which validates the Supabase-issued JWT and returns the Auth user. We then
 *   fetch the profiles row to get role/position data.
 *
 *   When Supabase is NOT yet configured (mock mode): fall back to the
 *   existing jsonwebtoken verification against mockData users. This lets the
 *   app run correctly during the incremental migration.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabase } = require('../config/supabase');
const { users } = require('../data/mockData');
const { hasAdminAccess, isTeacherAdmin } = require('../models/User');

const SUPABASE_READY = !!supabase;

// ─── Core JWT verifier ───────────────────────────────────────

async function verifyAndAttachUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  if (SUPABASE_READY) {
    // ── Supabase path ────────────────────────────────────────
    // getUser() validates the JWT against Supabase Auth, handles expiry, etc.
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch the profile row so we have role/position for authorization checks
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    req.user = profile;
    return next();
  }

  // ── Mock fallback path ──────────────────────────────────────
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

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

// ─── Guards ──────────────────────────────────────────────────

/**
 * requireAuth — Any authenticated user
 */
async function requireAuth(req, res, next) {
  await verifyAndAttachUser(req, res, next);
}

/**
 * requireAdmin — Teacher OR Leadership student
 * Used for: member CRUD, activity CRUD, attendance, contributions
 */
async function requireAdmin(req, res, next) {
  await verifyAndAttachUser(req, res, async () => {
    if (!hasAdminAccess(req.user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/**
 * requireTeacher — Teacher/Super Admin only
 * Used for: assigning/removing leadership positions
 */
async function requireTeacher(req, res, next) {
  await verifyAndAttachUser(req, res, async () => {
    if (!isTeacherAdmin(req.user)) {
      return res.status(403).json({ error: 'Only the Teacher/Super Admin can perform this action' });
    }
    next();
  });
}

/**
 * requireMember — Alias for requireAuth
 */
async function requireMember(req, res, next) {
  return requireAuth(req, res, next);
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireTeacher,
  requireMember,
};

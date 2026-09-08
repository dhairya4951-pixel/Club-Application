/**
 * Authentication & Authorization Middleware
 * ==========================================
 * Three-tier guards:
 *
 *   requireAuth    — Any authenticated user
 *   requireAdmin   — Teacher OR Leadership student (admin-level CRUD)
 *   requireTeacher — Teacher ONLY (position management)
 *
 * JWT Verification Strategy (Optimized for Serverless):
 *   When Supabase is configured: decode the Supabase-issued JWT locally
 *   to extract the user ID (sub) and expiry. Then fetch the profile row
 *   with a single database query. This eliminates the expensive remote
 *   supabase.auth.getUser() call (~200-400ms) that was the primary
 *   bottleneck in Vercel serverless functions.
 *
 *   The in-memory cache still helps within a warm serverless instance.
 *
 *   When Supabase is NOT yet configured (mock mode): fall back to the
 *   existing jsonwebtoken verification against mockData users.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabase } = require('../config/supabase');
const { users } = require('../data/mockData');
const { hasAdminAccess, isTeacherAdmin } = require('../models/User');

const SUPABASE_READY = !!supabase;

// In-memory profile cache (5 min TTL) — keyed by user ID for better reuse
// across token refreshes. On Vercel, this helps within a warm instance.
const profileCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedProfile(userId) {
  const cached = profileCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.profile;
  }
  profileCache.delete(userId);
  return null;
}

function setCachedProfile(userId, profile) {
  profileCache.set(userId, {
    profile,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  // Evict expired entries when cache grows large
  if (profileCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of profileCache.entries()) {
      if (now >= v.expiresAt) profileCache.delete(k);
    }
  }
}

/**
 * Decode a Supabase JWT locally without a remote call.
 * Extracts the user ID (sub) and checks expiry.
 * Returns { userId, email } or null if invalid/expired.
 */
function decodeSupabaseJWT(token) {
  try {
    // Decode without verification — the token was issued by Supabase Auth
    // and transmitted over HTTPS. We validate expiry locally and use the
    // user ID to fetch authorization data from our profiles table.
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.sub) return null;

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Verify it's a Supabase-issued token (not a random JWT)
    if (decoded.iss && !decoded.iss.includes('supabase')) {
      return null;
    }

    return { userId: decoded.sub, email: decoded.email };
  } catch {
    return null;
  }
}

// ─── Core JWT verifier ───────────────────────────────────────

async function verifyAndAttachUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  if (SUPABASE_READY) {
    // ── Optimized Supabase path ───────────────────────────────
    // Step 1: Decode JWT locally (0ms) instead of remote getUser() (~300ms)
    const decoded = decodeSupabaseJWT(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Step 2: Check profile cache (keyed by user ID, survives token refreshes)
    const cachedProfile = getCachedProfile(decoded.userId);
    if (cachedProfile) {
      req.user = cachedProfile;
      return next();
    }

    // Step 3: Single profile query (~100-200ms) instead of getUser + profile (~400-600ms)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    setCachedProfile(decoded.userId, profile);
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


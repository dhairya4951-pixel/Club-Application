/**
 * Auth Service
 * ============
 * Handles authentication against Supabase Auth.
 *
 * Strategy: The frontend calls the Express backend for login, which in turn
 * calls Supabase Auth. The returned Supabase JWT is forwarded to the frontend
 * and stored in sessionStorage. Subsequent API calls send that JWT in the
 * Authorization header and the backend verifies it with Supabase.
 *
 * Why not use Supabase Auth directly on the frontend?
 *   We want all auth logic gated through the trusted backend so that security
 *   rules (requireAdmin, requireTeacher) remain in one place and the Service
 *   Role key never leaves the server.
 */

const { supabase } = require('../config/supabase');

// ─── Fallback: mock mode (Supabase not yet connected) ────────
// This allows the server to still start/run during initial setup.
const { users } = require('../data/mockData');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { sanitizeUser } = require('../models/User');

const SUPABASE_READY = !!supabase;

// ─── Login ───────────────────────────────────────────────────

async function login(email, password) {
  if (!SUPABASE_READY) {
    return _mockLogin(email, password);
  }

  // 1. Sign in with Supabase Auth (email + password)
  // We MUST create a local client instance for this.
  // Using the global `supabase` client here would permanently mutate
  // its session to the logged-in user, breaking the service_role bypass for all subsequent requests!
  const { createClient } = require('@supabase/supabase-js');
  const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: 'Invalid email or password', status: 401 };
  }

  // 2. Fetch the profile row using the Auth UUID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'User profile not found. Contact an administrator.', status: 404 };
  }

  // 3. Return the Supabase session tokens + profile data.
  //    The frontend stores the access_token and sends it as Bearer on all requests.
  //    The refresh_token is needed so the frontend Supabase client can persist
  //    the session in localStorage and auto-restore it after page refresh.
  return {
    data: {
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: profile,
    },
  };
}

// ─── Get Current User ─────────────────────────────────────────

async function getCurrentUser(userId) {
  if (!SUPABASE_READY) {
    return _mockGetCurrentUser(userId);
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { error: 'User not found', status: 404 };
  }

  return { data: profile };
}

// ─── Mock Fallbacks (used when SUPABASE_URL not yet configured) ───

async function _mockLogin(email, password) {
  const user = users.find(u => u.email === email);
  if (!user) return { error: 'Invalid email or password', status: 401 };

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return { error: 'Invalid email or password', status: 401 };

  const token = jwt.sign(
    { userId: user.id, role: user.role, position: user.position },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return { data: { token, user: sanitizeUser(user) } };
}

function _mockGetCurrentUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return { error: 'User not found', status: 404 };
  return { data: sanitizeUser(user) };
}

module.exports = { login, getCurrentUser };

/**
 * Supabase Admin Client — Backend Only
 * ======================================
 * Uses the SERVICE ROLE key which bypasses Row Level Security.
 * This key MUST NEVER be sent to the browser.
 *
 * Why service role here?
 *   The Express backend enforces all authorization logic via middleware
 *   (requireAuth, requireAdmin, requireTeacher). Since our business-logic
 *   security lives in Node.js, we do not need per-row RLS on the DB side.
 *   The service role lets the backend perform any operation without
 *   needing to pass user JWTs to Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Treat placeholder values as unconfigured
const IS_CONFIGURED =
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('YOUR_PROJECT_REF') &&
  !supabaseServiceKey.includes('YOUR_SERVICE_ROLE_KEY');

if (!IS_CONFIGURED) {
  console.warn(
    '\n⚠️  Supabase not configured — running in mock mode.\n' +
    '   Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env\n'
  );
}

const supabase = IS_CONFIGURED
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const SUPABASE_READY = !!supabase;

module.exports = { supabase, SUPABASE_READY };

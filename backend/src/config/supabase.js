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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '\n❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env\n' +
    '   Visit https://supabase.com/dashboard → your project → Settings → API\n'
  );
  // Don't crash the process during initial setup — just warn.
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        // Disable auto session management — the backend doesn't need it.
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

module.exports = { supabase };

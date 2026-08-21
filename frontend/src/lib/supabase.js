/**
 * Supabase Browser Client — Frontend Only
 * ========================================
 * Uses the PUBLIC anon key. This is safe to expose to the browser
 * because Row Level Security (RLS) on the Supabase side controls access,
 * and all privileged operations go through the Express backend.
 *
 * We primarily use this client for:
 *   - Detecting session changes (onAuthStateChange)
 *   - Future: Supabase Realtime subscriptions (discussion chat)
 *   - Future: Direct Supabase Storage uploads
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When env vars are not yet set, the client is null and the app falls back to
// the existing Express + sessionStorage auth flow automatically.
export const supabase =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_PROJECT_REF')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const SUPABASE_READY = !!supabase;

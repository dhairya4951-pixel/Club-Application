/**
 * Auth Context
 * ============
 * Provides authentication state to the entire app.
 *
 * Dual-mode operation:
 *
 *   SUPABASE_READY = true:
 *     - Login is performed by calling POST /api/auth/login which internally
 *       calls Supabase Auth and returns a Supabase access_token + profile data.
 *     - The Supabase access_token is stored in sessionStorage and used as the
 *       Bearer token on all /api/* requests.
 *     - On mount, we also subscribe to supabase.auth.onAuthStateChange so that
 *       if the Supabase session refreshes automatically, we keep the token fresh.
 *
 *   SUPABASE_READY = false (mock mode):
 *     - The existing behavior is preserved exactly: custom JWT stored in
 *       sessionStorage, verified server-side against mockData.
 *
 * Role hierarchy:
 *   isTeacher    — Teacher/Super Admin (full access + position management)
 *   isLeadership — Student with leadership position (admin CRUD, no position mgmt)
 *   isAdmin      — Either of the above (used for route guards and UI)
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { setTokenGetter } from '../services/api';
import { supabase, SUPABASE_READY } from '../lib/supabase';

const LEADERSHIP_POSITIONS = ['president', 'vice_president', 'general_secretary'];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Always keep the API layer's token getter in sync
  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  // ── Session Restore on Mount ──────────────────────────────────

  useEffect(() => {
    let unsubscribe = null;

    async function initSession() {
      if (SUPABASE_READY) {
        // Supabase manages the session internally. We just need to get the
        // current session and subscribe to changes.
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          await _hydrateFromSupabaseSession(session);
        }

        // Subscribe to future session changes (token refresh, logout from another tab)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session) {
                await _hydrateFromSupabaseSession(session);
              }
            } else if (event === 'SIGNED_OUT') {
              _clearSession();
            }
          }
        );
        unsubscribe = () => subscription.unsubscribe();
        setLoading(false);
        return;
      }

      // ── Mock mode: restore from sessionStorage ──────────────
      const savedToken = sessionStorage.getItem('club_token');
      if (savedToken) {
        setToken(savedToken);
        setTokenGetter(() => savedToken);
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch {
          sessionStorage.removeItem('club_token');
          setToken(null);
        }
      }
      setLoading(false);
    }

    initSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ── Internal Helpers ──────────────────────────────────────────

  async function _hydrateFromSupabaseSession(session) {
    const accessToken = session.access_token;
    setToken(accessToken);
    setTokenGetter(() => accessToken);
    sessionStorage.setItem('club_token', accessToken);

    // Fetch the profile from our backend (which queries the profiles table)
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      _clearSession();
    }
  }

  function _clearSession() {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('club_token');
  }

  // ── Auth Actions ──────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    // Always POST to our backend — it handles Supabase or mock internally
    const response = await authService.login(email, password);
    const { token: newToken, refreshToken, user: userData } = response;

    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem('club_token', newToken);
    setTokenGetter(() => newToken);

    // Tell the frontend Supabase client about this session so it persists
    // the tokens in localStorage. This is what enables session restore on
    // page refresh via supabase.auth.getSession().
    if (SUPABASE_READY && refreshToken) {
      await supabase.auth.setSession({
        access_token: newToken,
        refresh_token: refreshToken,
      });
    }

    return userData;
  }, []);

  const logout = useCallback(async () => {
    if (SUPABASE_READY) {
      // Sign out from Supabase (invalidates the session server-side)
      await supabase.auth.signOut();
    }
    _clearSession();
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  }, []);

  // ── Three-tier role derivation ────────────────────────────────

  // Support both camelCase (mock data) and snake_case (Supabase profiles table)
  const userPosition = user?.position;
  const userRole = user?.role;

  const isTeacher = userRole === 'teacher_admin';
  const isLeadership = userRole === 'member' && LEADERSHIP_POSITIONS.includes(userPosition);
  const isAdmin = isTeacher || isLeadership;
  const isAuthenticated = !!user;

  const value = {
    user,
    token,
    loading,
    isTeacher,
    isLeadership,
    isAdmin,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

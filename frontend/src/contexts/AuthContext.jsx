/**
 * Auth Context
 * ============
 * Provides authentication state to the entire app.
 * Stores token in memory (not localStorage) for security readiness.
 *
 * Role hierarchy:
 *   isTeacher    — Teacher/Super Admin (full access + position management)
 *   isLeadership — Student with leadership position (admin CRUD, no position mgmt)
 *   isAdmin      — Either of the above (used for route guards and UI)
 *
 * SUPABASE MIGRATION:
 *   Replace token management with supabase.auth.onAuthStateChange()
 *   Replace login/logout with supabase.auth methods
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { setTokenGetter } from '../services/api';

const LEADERSHIP_POSITIONS = ['president', 'vice_president', 'general_secretary'];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register token getter for API service
  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  // Try to restore session from sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('club_token');
    if (savedToken) {
      setToken(savedToken);
      setTokenGetter(() => savedToken);
      authService.getMe()
        .then(userData => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          sessionStorage.removeItem('club_token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    sessionStorage.setItem('club_token', response.token);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('club_token');
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  }, []);

  // Three-tier role derivation
  const isTeacher = user?.role === 'teacher_admin';
  const isLeadership = user?.role === 'member' && LEADERSHIP_POSITIONS.includes(user?.position);
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

/**
 * API Service — Base fetch wrapper
 * =================================
 * All HTTP requests go through this layer.
 * Handles auth headers, error parsing, and response formatting.
 *
 * SUPABASE MIGRATION:
 *   This file stays mostly the same. Individual service files
 *   will switch from fetch calls to supabase client queries.
 */

const API_BASE = '/api';

// Fallback to sessionStorage so requests immediately after refresh or mount are authenticated
let getToken = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('club_token');
  }
  return null;
};

/**
 * Register the token getter (called by AuthContext on init)
 */
export function setTokenGetter(fn) {
  getToken = () => {
    const custom = fn?.();
    if (custom) return custom;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('club_token');
    }
    return null;
  };
}

/**
 * Make an authenticated API request
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || 'Something went wrong',
      };
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 500, message: 'Network error. Please check your connection.' };
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
};

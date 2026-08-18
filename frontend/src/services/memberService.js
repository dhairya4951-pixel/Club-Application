import { api } from './api';

export const memberService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/members${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.patch(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),

  // Position management (Teacher-only)
  assignPosition: (id, position) => api.patch(`/members/${id}/position`, { position }),
  removePosition: (id) => api.delete(`/members/${id}/position`),
  getLeadershipStatus: () => api.get('/members/leadership'),
};

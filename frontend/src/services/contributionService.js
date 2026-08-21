/**
 * Contribution Service — Frontend API Wrapper
 */
import { api } from './api';

export const contributionService = {
  getTypes: () => api.get('/contributions/types'),
  getAll: () => api.get('/contributions'),
  getByMember: (memberId) => api.get(`/contributions/member/${memberId}`),
  getById: (id) => api.get(`/contributions/${id}`),
  create: (data) => api.post('/contributions', data),
  update: (id, data) => api.patch(`/contributions/${id}`, data),
  remove: (id) => api.delete(`/contributions/${id}`),
  getAuditLog: (id) => api.get(`/contributions/${id}/audit`),
};

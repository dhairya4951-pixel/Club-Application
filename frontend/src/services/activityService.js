import { api } from './api';

export const activityService = {
  getAll: () => api.get('/activities'),
  getUpcoming: () => api.get('/activities/upcoming'),
  getPast: () => api.get('/activities/past'),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.patch(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
};

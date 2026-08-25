import { api } from './api';

export const messageService = {
  getAll: () => api.get('/messages'),
  send: (message) => api.post('/messages', { message }),
  update: (id, message) => api.patch(`/messages/${id}`, { message }),
  delete: (id) => api.delete(`/messages/${id}`),
};

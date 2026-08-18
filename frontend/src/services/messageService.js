import { api } from './api';

export const messageService = {
  getAll: () => api.get('/messages'),
  send: (message) => api.post('/messages', { message }),
  delete: (id) => api.delete(`/messages/${id}`),
};

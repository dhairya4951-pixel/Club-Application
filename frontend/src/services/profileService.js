import { api } from './api';

export const profileService = {
  get: () => api.get('/profile'),
  update: (data) => api.patch('/profile', data),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/profile/password', { currentPassword, newPassword }),
};

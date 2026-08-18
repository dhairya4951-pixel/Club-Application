import { api } from './api';

export const attendanceService = {
  getMyAttendance: () => api.get('/attendance/me'),
  getActivityAttendance: (activityId) => api.get(`/activities/${activityId}/attendance`),
  updateActivityAttendance: (activityId, records) =>
    api.patch(`/activities/${activityId}/attendance`, { records }),
};

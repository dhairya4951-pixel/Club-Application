/**
 * Engagement Service — Frontend API Wrapper
 */
import { api } from './api';

export const engagementService = {
  getMyEngagement: () => api.get('/engagement/me'),
  getMemberEngagement: (memberId) => api.get(`/engagement/member/${memberId}`),
  getAllEngagement: () => api.get('/engagement/all'),
  getTimeline: (memberId) => api.get(`/engagement/timeline/${memberId}`),
};

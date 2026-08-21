/**
 * Image Service — Frontend Upload Layer
 * ======================================
 * Handles image uploads via FormData.
 * Uses the base API fetch wrapper which already supports FormData.
 */

import { api } from './api';

export const imageService = {
  /**
   * Upload a profile image for the current user.
   * @param {File} file
   * @returns {Promise<{ message, url, user }>}
   */
  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.upload('/upload/profile-image', formData);
  },

  /**
   * Remove the current user's profile image.
   * @returns {Promise<{ message, user }>}
   */
  removeProfileImage: () => api.delete('/upload/profile-image'),

  /**
   * Upload an activity cover image.
   * @param {File} file
   * @param {string} [activityId] - Optional existing activity ID
   * @returns {Promise<{ message, url }>}
   */
  uploadActivityImage: (file, activityId) => {
    const formData = new FormData();
    formData.append('image', file);
    if (activityId) formData.append('activityId', activityId);
    return api.upload('/upload/activity-image', formData);
  },
};

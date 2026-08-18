/**
 * Activity Service
 * ================
 * CRUD operations for activities/events.
 *
 * SUPABASE MIGRATION:
 *   Replace array operations with:
 *     supabase.from('activities').select/insert/update/delete
 */

const { activities } = require('../data/mockData');
const { ACTIVITY_STATUS } = require('../models/Activity');
const { generateId, now } = require('../utils/helpers');

function getAllActivities() {
  // Sort by date descending (newest first)
  const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { data: sorted };
}

function getUpcomingActivities() {
  const upcoming = activities
    .filter(a => a.status === ACTIVITY_STATUS.UPCOMING)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return { data: upcoming };
}

function getPastActivities() {
  const past = activities
    .filter(a => a.status === ACTIVITY_STATUS.COMPLETED)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return { data: past };
}

function getActivityById(id) {
  const activity = activities.find(a => a.id === id);
  if (!activity) {
    return { error: 'Activity not found', status: 404 };
  }
  return { data: activity };
}

function createActivity({ title, description, coverImage, additionalImages, date, time, location, status, category, createdBy }) {
  const newActivity = {
    id: generateId(),
    title: title.trim(),
    description: description.trim(),
    coverImage: coverImage || null,
    additionalImages: additionalImages || [],
    date,
    time,
    location: location.trim(),
    status: status || ACTIVITY_STATUS.UPCOMING,
    category: category || 'Other',
    createdBy,
    createdAt: now(),
    updatedAt: now(),
  };

  activities.push(newActivity);
  return { data: newActivity };
}

function updateActivity(id, updates) {
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) {
    return { error: 'Activity not found', status: 404 };
  }

  const allowedFields = ['title', 'description', 'coverImage', 'additionalImages', 'date', 'time', 'location', 'status', 'category'];
  const safeUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  safeUpdates.updatedAt = now();
  Object.assign(activities[index], safeUpdates);

  return { data: activities[index] };
}

function deleteActivity(id) {
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) {
    return { error: 'Activity not found', status: 404 };
  }

  const deleted = activities.splice(index, 1)[0];
  return { data: deleted };
}

module.exports = {
  getAllActivities,
  getUpcomingActivities,
  getPastActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
};

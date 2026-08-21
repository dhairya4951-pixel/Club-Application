/**
 * Activity Service
 * ================
 * CRUD operations for activities/events.
 */

const { activities } = require('../data/mockData');
const { ACTIVITY_STATUS } = require('../models/Activity');
const { generateId, now } = require('../utils/helpers');
const { supabase, SUPABASE_READY } = require('../config/supabase');

async function getAllActivities() {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return { data };
  }

  // Mock fallback
  const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
  return { data: sorted };
}

async function getUpcomingActivities() {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('status', ACTIVITY_STATUS.UPCOMING)
      .order('date', { ascending: true });
    if (error) throw new Error(error.message);
    return { data };
  }

  const upcoming = activities
    .filter(a => a.status === ACTIVITY_STATUS.UPCOMING)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return { data: upcoming };
}

async function getPastActivities() {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('status', ACTIVITY_STATUS.COMPLETED)
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return { data };
  }

  const past = activities
    .filter(a => a.status === ACTIVITY_STATUS.COMPLETED)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return { data: past };
}

async function getActivityById(id) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return { error: 'Activity not found', status: 404 };
    return { data };
  }

  const activity = activities.find(a => a.id === id);
  if (!activity) {
    return { error: 'Activity not found', status: 404 };
  }
  return { data: activity };
}

async function createActivity({ title, description, coverImage, additionalImages, date, time, location, status, category, createdBy }) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        title: title.trim(),
        description: description.trim(),
        cover_image: coverImage || null,
        additional_images: additionalImages || [],
        date,
        time,
        location: location.trim(),
        status: status || ACTIVITY_STATUS.UPCOMING,
        category: category || 'Other',
        created_by: createdBy
      }])
      .select()
      .single();
    
    if (error) return { error: error.message, status: 500 };
    return { data };
  }

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

async function updateActivity(id, updates) {
  if (SUPABASE_READY) {
    const allowedFields = {
      title: 'title',
      description: 'description',
      coverImage: 'cover_image',
      additionalImages: 'additional_images',
      date: 'date',
      time: 'time',
      location: 'location',
      status: 'status',
      category: 'category'
    };

    const safeUpdates = {};
    for (const [jsKey, dbKey] of Object.entries(allowedFields)) {
      if (updates[jsKey] !== undefined) {
        safeUpdates[dbKey] = updates[jsKey];
      }
    }
    // also allow sending snake_case directly
    for (const key of Object.values(allowedFields)) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return { error: 'No valid fields to update', status: 400 };
    }

    const { data, error } = await supabase
      .from('activities')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, status: 500 };
    return { data };
  }

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

async function deleteActivity(id) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, status: 500 };
    if (!data) return { error: 'Activity not found', status: 404 };
    return { data };
  }

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

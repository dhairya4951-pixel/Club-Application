/**
 * Upload Controller
 * =================
 * Handles image upload endpoints for profiles and activities.
 */

const imageService = require('../services/imageService');
const { users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const { now } = require('../utils/helpers');
const { supabase, SUPABASE_READY } = require('../config/supabase');
const { camelizeKeys } = require('../utils/responseHelpers');

/**
 * POST /api/upload/profile-image
 * Uploads a profile image for the currently authenticated user.
 */
async function uploadProfileImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    let user;
    if (SUPABASE_READY) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      user = profile;
    } else {
      user = users.find(u => u.id === req.user.id);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile image
    if (user.profile_image || user.profileImage) {
      const oldUrl = user.profile_image || user.profileImage;
      const oldPath = imageService.pathFromUrl(oldUrl);
      if (oldPath) {
        await imageService.delete('profiles', oldPath);
      }
    }

    // Upload new image
    const result = await imageService.upload(req.file, 'profiles', req.user.id);

    // Update user record
    if (SUPABASE_READY) {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ profile_image: result.url })
        .eq('id', req.user.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      user = updatedProfile;
    } else {
      user.profileImage = result.url;
      user.updatedAt = now();
      user = sanitizeUser(user);
    }

    res.json({
      message: 'Profile image uploaded successfully',
      url: result.url,
      user: camelizeKeys(user),
    });
  } catch (err) {
    if (err.message && err.message.includes('upload')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * DELETE /api/upload/profile-image
 * Removes the current user's profile image.
 */
async function removeProfileImage(req, res, next) {
  try {
    let user;
    if (SUPABASE_READY) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      user = profile;
    } else {
      user = users.find(u => u.id === req.user.id);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the file
    const oldUrl = user.profile_image || user.profileImage;
    if (oldUrl) {
      const oldPath = imageService.pathFromUrl(oldUrl);
      if (oldPath) {
        await imageService.delete('profiles', oldPath);
      }
    }

    // Update record
    if (SUPABASE_READY) {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ profile_image: null })
        .eq('id', req.user.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      user = updatedProfile;
    } else {
      user.profileImage = null;
      user.updatedAt = now();
      user = sanitizeUser(user);
    }

    res.json({
      message: 'Profile image removed',
      user: camelizeKeys(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/upload/activity-image
 * Uploads a cover image for an activity.
 * Requires admin access (teacher or leadership).
 */
async function uploadActivityImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate a temp ID for the upload (the activity may not exist yet)
    const entityId = req.body.activityId || 'new';

    const result = await imageService.upload(req.file, 'activities', entityId);

    res.json({
      message: 'Activity image uploaded successfully',
      url: result.url,
    });
  } catch (err) {
    if (err.message && err.message.includes('upload')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { uploadProfileImage, removeProfileImage, uploadActivityImage };

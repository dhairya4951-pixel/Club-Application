/**
 * Upload Controller
 * =================
 * Handles image upload endpoints for profiles and activities.
 */

const imageService = require('../services/imageService');
const { users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const { now } = require('../utils/helpers');

/**
 * POST /api/upload/profile-image
 * Uploads a profile image for the currently authenticated user.
 * Enforces own-user-only: you can only upload YOUR profile photo.
 */
function uploadProfileImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Delete old profile image if it was a local upload
    const user = users.find(u => u.id === req.user.id);
    if (user && user.profileImage) {
      const oldPath = imageService.pathFromUrl(user.profileImage);
      if (oldPath) {
        imageService.delete(oldPath);
      }
    }

    // Upload new image
    const result = imageService.upload(req.file, 'profiles', req.user.id);

    // Update user record
    if (user) {
      user.profileImage = result.url;
      user.updatedAt = now();
    }

    res.json({
      message: 'Profile image uploaded successfully',
      url: result.url,
      user: user ? sanitizeUser(user) : null,
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
function removeProfileImage(req, res, next) {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the file if it's a local upload
    if (user.profileImage) {
      const oldPath = imageService.pathFromUrl(user.profileImage);
      if (oldPath) {
        imageService.delete(oldPath);
      }
    }

    user.profileImage = null;
    user.updatedAt = now();

    res.json({
      message: 'Profile image removed',
      user: sanitizeUser(user),
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
function uploadActivityImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate a temp ID for the upload (the activity may not exist yet)
    const entityId = req.body.activityId || 'new';

    const result = imageService.upload(req.file, 'activities', entityId);

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

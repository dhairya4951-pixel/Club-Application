/**
 * Profile Controller
 * Handles the logged-in user's own profile operations.
 * Password change is delegated to Supabase Auth when connected.
 */

const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const { now } = require('../utils/helpers');

const SUPABASE_READY = !!supabase;

function getProfile(req, res) {
  res.json(req.user);
}

async function updateProfile(req, res, next) {
  try {
    // Block role/position self-promotion on all paths
    if (req.body.role || req.body.position) {
      return res.status(403).json({ error: 'Cannot change your own role or position' });
    }

    const allowedFields = ['name', 'bio', 'course', 'year', 'profileImage'];
    const safeUpdates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) safeUpdates[field] = req.body[field];
    }

    if (SUPABASE_READY) {
      // Map camelCase → snake_case for DB
      const dbUpdates = {};
      if (safeUpdates.name !== undefined) dbUpdates.name = safeUpdates.name;
      if (safeUpdates.bio !== undefined) dbUpdates.bio = safeUpdates.bio;
      if (safeUpdates.course !== undefined) dbUpdates.course = safeUpdates.course;
      if (safeUpdates.year !== undefined) dbUpdates.year = safeUpdates.year;
      if (safeUpdates.profileImage !== undefined) dbUpdates.profile_image = safeUpdates.profileImage;

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      // Normalize profile_image → profileImage for frontend compatibility
      const normalized = normalizeProfile(data);
      return res.json(normalized);
    }

    // Mock fallback
    const index = users.findIndex(u => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    safeUpdates.updatedAt = now();
    Object.assign(users[index], safeUpdates);
    res.json(sanitizeUser(users[index]));
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    if (SUPABASE_READY) {
      // Step 1: Verify the current password by signing in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: req.user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Step 2: Update password using the admin API (we're on the trusted server)
      const { error: updateError } = await supabase.auth.admin.updateUserById(req.user.id, {
        password: newPassword,
      });

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      return res.json({ message: 'Password changed successfully' });
    }

    // Mock fallback
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = now();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Normalize a profiles DB row to the camelCase shape the frontend expects.
 * The profiles table uses snake_case (profile_image) but the frontend reads profileImage.
 */
function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    profileImage: profile.profile_image,
  };
}

module.exports = { getProfile, updateProfile, changePassword };

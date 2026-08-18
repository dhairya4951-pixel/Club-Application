/**
 * Profile Controller
 * Handles the logged-in user's own profile operations.
 */

const bcrypt = require('bcryptjs');
const { users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const { now } = require('../utils/helpers');

function getProfile(req, res) {
  res.json(req.user);
}

function updateProfile(req, res, next) {
  try {
    const index = users.findIndex(u => u.id === req.user.id);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Members can only edit these fields about themselves
    const allowedFields = ['name', 'bio', 'course', 'year', 'profileImage'];
    const safeUpdates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        safeUpdates[field] = req.body[field];
      }
    }

    // Explicitly prevent role/position self-promotion
    if (req.body.role || req.body.position) {
      return res.status(403).json({ error: 'Cannot change your own role or position' });
    }

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

    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = now();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };

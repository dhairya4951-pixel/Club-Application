/**
 * Member Service
 * ==============
 * CRUD operations for club members + leadership position management.
 *
 * Authorization hierarchy:
 *   teacher_admin — Full CRUD + position assignment/removal
 *   leadership student — CRUD (no position changes)
 *   normal member — Read only (enforced at route level)
 *
 * SUPABASE MIGRATION:
 *   Replace array operations with:
 *     supabase.from('profiles').select/insert/update/delete
 */

const bcrypt = require('bcryptjs');
const { users } = require('../data/mockData');
const {
  sanitizeUser,
  ROLES,
  POSITIONS,
  LEADERSHIP_POSITIONS,
  isTeacherAdmin,
  isLeadershipAdmin,
} = require('../models/User');
const { generateId, now } = require('../utils/helpers');

function getAllMembers() {
  return { data: users.map(sanitizeUser) };
}

function getMemberById(id) {
  const user = users.find(u => u.id === id);
  if (!user) {
    return { error: 'Member not found', status: 404 };
  }
  return { data: sanitizeUser(user) };
}

function searchMembers(query) {
  const lowerQuery = query.toLowerCase();
  const results = users.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.email.toLowerCase().includes(lowerQuery) ||
    u.course?.toLowerCase().includes(lowerQuery)
  );
  return { data: results.map(sanitizeUser) };
}

function filterByRole(role) {
  // Support legacy 'admin' filter — map it to users with admin access
  if (role === 'admin') {
    const results = users.filter(u =>
      u.role === ROLES.TEACHER_ADMIN || LEADERSHIP_POSITIONS.includes(u.position)
    );
    return { data: results.map(sanitizeUser) };
  }
  if (role === 'member') {
    const results = users.filter(u =>
      u.role === ROLES.MEMBER && !LEADERSHIP_POSITIONS.includes(u.position)
    );
    return { data: results.map(sanitizeUser) };
  }
  const results = users.filter(u => u.role === role);
  return { data: results.map(sanitizeUser) };
}

function createMember({ name, email, password, course, year, bio, profileImage }, requestingUser) {
  // Check for duplicate email
  if (users.find(u => u.email === email)) {
    return { error: 'Email already exists', status: 409 };
  }

  const newUser = {
    id: generateId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: ROLES.MEMBER,
    position: POSITIONS.NONE,
    profileImage: profileImage || null,
    course: course || null,
    year: year || null,
    bio: bio || null,
    createdAt: now(),
    updatedAt: now(),
  };

  // New members are always created as normal members with position:none
  // Leadership positions are assigned separately by the teacher

  users.push(newUser);
  return { data: sanitizeUser(newUser) };
}

function updateMember(id, updates, requestingUser) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'Member not found', status: 404 };
  }

  const targetUser = users[index];

  // Prevent editing the teacher account by non-teachers
  if (targetUser.role === ROLES.TEACHER_ADMIN && !isTeacherAdmin(requestingUser)) {
    return { error: 'Cannot edit the Teacher/Super Admin account', status: 403 };
  }

  // Check email uniqueness if email is being changed
  if (updates.email && updates.email !== targetUser.email) {
    if (users.find(u => u.email === updates.email)) {
      return { error: 'Email already exists', status: 409 };
    }
  }

  // Allowed update fields — NO role or position changes through this endpoint
  const allowedFields = ['name', 'email', 'course', 'year', 'bio', 'profileImage'];
  const safeUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  // Explicitly block position/role changes through this endpoint
  if (updates.position !== undefined || updates.role !== undefined) {
    return { error: 'Position changes must go through the dedicated position management endpoint', status: 403 };
  }

  safeUpdates.updatedAt = now();
  Object.assign(users[index], safeUpdates);

  return { data: sanitizeUser(users[index]) };
}

function deleteMember(id, requestingUser) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'Member not found', status: 404 };
  }

  const targetUser = users[index];

  // Cannot delete the teacher account
  if (targetUser.role === ROLES.TEACHER_ADMIN) {
    return { error: 'Cannot delete the Teacher/Super Admin account', status: 403 };
  }

  // Cannot delete a leadership holder without removing their position first
  if (LEADERSHIP_POSITIONS.includes(targetUser.position)) {
    return {
      error: `${targetUser.name} currently holds the ${targetUser.position.replace('_', ' ')} position. Remove their position before deleting this account.`,
      status: 409,
    };
  }

  // Prevent leadership students from deleting other leadership students
  if (isLeadershipAdmin(requestingUser) && LEADERSHIP_POSITIONS.includes(targetUser.position)) {
    return { error: 'Only the Teacher/Super Admin can delete leadership accounts', status: 403 };
  }

  const deleted = users.splice(index, 1)[0];
  return { data: sanitizeUser(deleted) };
}

// ─── Position Management (Teacher-only) ──────────────────

/**
 * Assign a leadership position to a member.
 * - Only teacher_admin can call this
 * - Enforces one-holder-per-position exclusivity
 * - Returns info about previous holder if position was occupied
 */
function assignPosition(memberId, position, requestingUser) {
  // Only teacher can manage positions (double-check at service level)
  if (!isTeacherAdmin(requestingUser)) {
    return { error: 'Only the Teacher/Super Admin can assign positions', status: 403 };
  }

  const member = users.find(u => u.id === memberId);
  if (!member) {
    return { error: 'Member not found', status: 404 };
  }

  // Cannot assign positions to the teacher account
  if (member.role === ROLES.TEACHER_ADMIN) {
    return { error: 'Cannot assign student positions to the Teacher account', status: 400 };
  }

  // If setting to 'none', use removePosition instead
  if (position === POSITIONS.NONE) {
    return removePosition(memberId, requestingUser);
  }

  // Validate it's a valid leadership position
  if (!LEADERSHIP_POSITIONS.includes(position)) {
    return { error: `Invalid position. Must be one of: ${LEADERSHIP_POSITIONS.join(', ')}`, status: 400 };
  }

  // Check if someone already holds this position
  let previousHolder = null;
  const currentHolder = users.find(u => u.position === position && u.id !== memberId);
  if (currentHolder) {
    previousHolder = sanitizeUser(currentHolder);
    // Strip the position from the current holder
    currentHolder.position = POSITIONS.NONE;
    currentHolder.updatedAt = now();
  }

  // Assign the new position
  member.position = position;
  member.updatedAt = now();

  return {
    data: sanitizeUser(member),
    previousHolder,
  };
}

/**
 * Remove a leadership position from a member.
 * - Only teacher_admin can call this
 * - Member becomes a normal member with position:none
 */
function removePosition(memberId, requestingUser) {
  if (!isTeacherAdmin(requestingUser)) {
    return { error: 'Only the Teacher/Super Admin can remove positions', status: 403 };
  }

  const member = users.find(u => u.id === memberId);
  if (!member) {
    return { error: 'Member not found', status: 404 };
  }

  if (member.role === ROLES.TEACHER_ADMIN) {
    return { error: 'Cannot modify the Teacher account\'s position', status: 400 };
  }

  const previousPosition = member.position;
  member.position = POSITIONS.NONE;
  member.updatedAt = now();

  return {
    data: sanitizeUser(member),
    previousPosition,
  };
}

/**
 * Get current leadership positions — who holds what
 */
function getLeadershipStatus() {
  const result = {};
  for (const pos of LEADERSHIP_POSITIONS) {
    const holder = users.find(u => u.position === pos);
    result[pos] = holder ? sanitizeUser(holder) : null;
  }
  return { data: result };
}

module.exports = {
  getAllMembers,
  getMemberById,
  searchMembers,
  filterByRole,
  createMember,
  updateMember,
  deleteMember,
  assignPosition,
  removePosition,
  getLeadershipStatus,
};

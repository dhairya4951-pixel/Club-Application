/**
 * User Model
 * ===========
 * Three-tier role hierarchy:
 *   1. teacher_admin  — Full permissions + position management
 *   2. member + leadership position — Admin-level CRUD, no position management
 *   3. member + no position — Normal read-only member
 *
 * Positions:
 *   president, vice_president, general_secretary — exclusive (max 1 each)
 *   none — normal member
 */

const ROLES = {
  TEACHER_ADMIN: 'teacher_admin',
  MEMBER: 'member',
};

const POSITIONS = {
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  GENERAL_SECRETARY: 'general_secretary',
  NONE: 'none',
};

/**
 * Leadership positions that grant admin-level access
 */
const LEADERSHIP_POSITIONS = [
  POSITIONS.PRESIDENT,
  POSITIONS.VICE_PRESIDENT,
  POSITIONS.GENERAL_SECRETARY,
];

const POSITION_LABELS = {
  [POSITIONS.PRESIDENT]: 'President',
  [POSITIONS.VICE_PRESIDENT]: 'Vice President',
  [POSITIONS.GENERAL_SECRETARY]: 'General Secretary',
  [POSITIONS.NONE]: 'Member',
};

/**
 * Check if user is the Teacher/Super Admin
 */
function isTeacherAdmin(user) {
  return user?.role === ROLES.TEACHER_ADMIN;
}

/**
 * Check if user holds a student leadership position
 */
function isLeadershipAdmin(user) {
  return user?.role === ROLES.MEMBER && LEADERSHIP_POSITIONS.includes(user?.position);
}

/**
 * Check if user has any admin-level access (teacher OR leadership)
 */
function hasAdminAccess(user) {
  return isTeacherAdmin(user) || isLeadershipAdmin(user);
}

/**
 * Check if user can manage leadership positions (teacher only)
 */
function canManagePositions(user) {
  return isTeacherAdmin(user);
}

/**
 * Sanitize user object for API responses — strips passwordHash
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  ROLES,
  POSITIONS,
  LEADERSHIP_POSITIONS,
  POSITION_LABELS,
  isTeacherAdmin,
  isLeadershipAdmin,
  hasAdminAccess,
  canManagePositions,
  sanitizeUser,
};

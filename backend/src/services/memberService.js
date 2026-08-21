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
 * Supabase operations (create, delete) are gated by SUPABASE_READY flag.
 * All other read/update operations continue to use the profiles table via
 * supabase when connected, or mockData as fallback during migration.
 */

const { supabase } = require('../config/supabase');
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

const SUPABASE_READY = !!supabase;

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Strip passwordHash from a Supabase profile row (profiles table has none,
 * but mockData rows do). Returns a consistent safe object.
 */
function safeProfile(profile) {
  if (!profile) return null;
  const { passwordHash, ...safe } = profile;
  return safe;
}

// ─── READ operations (Supabase when ready, mock fallback) ────

async function getAllMembers() {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return { data };
  }
  return { data: users.map(sanitizeUser) };
}

async function getMemberById(id) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return { error: 'Member not found', status: 404 };
    return { data };
  }
  const user = users.find(u => u.id === id);
  if (!user) return { error: 'Member not found', status: 404 };
  return { data: sanitizeUser(user) };
}

async function searchMembers(query) {
  if (SUPABASE_READY) {
    const lowerQuery = query.toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%,course.ilike.%${lowerQuery}%`);
    if (error) throw new Error(error.message);
    return { data };
  }
  const lowerQuery = query.toLowerCase();
  const results = users.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.email.toLowerCase().includes(lowerQuery) ||
    u.course?.toLowerCase().includes(lowerQuery)
  );
  return { data: results.map(sanitizeUser) };
}

async function filterByRole(role) {
  if (SUPABASE_READY) {
    if (role === 'admin') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`role.eq.teacher_admin,position.in.(president,vice_president,general_secretary)`);
      if (error) throw new Error(error.message);
      return { data };
    }
    if (role === 'member') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'member')
        .eq('position', 'none');
      if (error) throw new Error(error.message);
      return { data };
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('role', role);
    if (error) throw new Error(error.message);
    return { data };
  }
  // mock fallback
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
  return { data: users.filter(u => u.role === role).map(sanitizeUser) };
}

// ─── CREATE ──────────────────────────────────────────────────

/**
 * Admin creates a new member account.
 * Flow (Supabase):
 *   1. Create Supabase Auth user with admin.createUser() — server-side only
 *   2. The handle_new_user() trigger auto-creates the profiles row
 *   3. Update the profile with additional fields not in auth metadata
 *   4. Return the profile
 *
 * Rollback: if the profile update fails after auth user creation, we delete
 * the auth user to prevent an orphaned auth account.
 */
async function createMember({ name, email, password, course, year, bio, profileImage }, requestingUser) {
  if (SUPABASE_READY) {
    let authUserId = null;

    try {
      // Step 1: Create the Supabase Auth user (admin API — never exposed to frontend)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,           // Skip email verification flow for admin-created accounts
        user_metadata: {
          name: name.trim(),
          role: 'member',
          position: 'none',
          course: course || null,
          year: year || null,
          bio: bio || null,
          profile_image: profileImage || null,
        },
      });

      if (authError) {
        // Duplicate email gives a 422 from Supabase
        if (authError.message?.toLowerCase().includes('already')) {
          return { error: 'Email already exists', status: 409 };
        }
        return { error: authError.message || 'Failed to create user account', status: 400 };
      }

      authUserId = authData.user.id;

      // Step 2: The trigger on auth.users already created a profiles row.
      // Fetch it to confirm and return it.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (profileError || !profile) {
        // Profile trigger may have failed — attempt rollback
        await supabase.auth.admin.deleteUser(authUserId);
        return { error: 'Failed to create user profile. Auth account rolled back.', status: 500 };
      }

      return { data: profile };

    } catch (err) {
      // Rollback auth user if it was created but something else failed
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId);
      }
      throw err;
    }
  }

  // ── Mock fallback ───────────────────────────────────────────
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
  users.push(newUser);
  return { data: sanitizeUser(newUser) };
}

// ─── UPDATE ──────────────────────────────────────────────────

async function updateMember(id, updates, requestingUser) {
  if (SUPABASE_READY) {
    // Fetch current profile to run authorization checks
    const { data: target, error: fetchError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();

    if (fetchError || !target) return { error: 'Member not found', status: 404 };

    // Prevent editing the teacher account by non-teachers
    if (target.role === ROLES.TEACHER_ADMIN && !isTeacherAdmin(requestingUser)) {
      return { error: 'Cannot edit the Teacher/Super Admin account', status: 403 };
    }

    // Block role/position changes through this endpoint
    if (updates.position !== undefined || updates.role !== undefined) {
      return { error: 'Position changes must go through the dedicated position management endpoint', status: 403 };
    }

    const allowedFields = ['name', 'course', 'year', 'bio', 'profile_image'];
    // Map camelCase keys from request body to snake_case DB columns
    const fieldMap = { profileImage: 'profile_image' };
    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) safeUpdates[field] = updates[field];
    }
    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updates[jsKey] !== undefined) safeUpdates[dbKey] = updates[jsKey];
    }

    if (Object.keys(safeUpdates).length === 0) {
      return { error: 'No valid fields to update', status: 400 };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, status: 500 };
    return { data };
  }

  // ── Mock fallback ───────────────────────────────────────────
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return { error: 'Member not found', status: 404 };

  const targetUser = users[index];
  if (targetUser.role === ROLES.TEACHER_ADMIN && !isTeacherAdmin(requestingUser)) {
    return { error: 'Cannot edit the Teacher/Super Admin account', status: 403 };
  }
  if (updates.email && updates.email !== targetUser.email) {
    if (users.find(u => u.email === updates.email)) {
      return { error: 'Email already exists', status: 409 };
    }
  }
  if (updates.position !== undefined || updates.role !== undefined) {
    return { error: 'Position changes must go through the dedicated position management endpoint', status: 403 };
  }

  const allowedFields = ['name', 'email', 'course', 'year', 'bio', 'profileImage'];
  const safeUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  }
  safeUpdates.updatedAt = now();
  Object.assign(users[index], safeUpdates);
  return { data: sanitizeUser(users[index]) };
}

// ─── DELETE ──────────────────────────────────────────────────

/**
 * Delete a member account.
 * Strategy (Supabase):
 *   - We delete the Supabase Auth user. The profiles row is linked via
 *     ON DELETE CASCADE so it is removed automatically.
 *   - Historical data (attendance, messages, contributions) references
 *     profiles.id with ON DELETE SET NULL or CASCADE, so records are
 *     preserved per the migration schema — the member_id becomes NULL
 *     instead of deleting the rows.
 */
async function deleteMember(id, requestingUser) {
  if (SUPABASE_READY) {
    const { data: target, error: fetchError } = await supabase
      .from('profiles')
      .select('role, position, name')
      .eq('id', id)
      .single();

    if (fetchError || !target) return { error: 'Member not found', status: 404 };

    if (target.role === ROLES.TEACHER_ADMIN) {
      return { error: 'Cannot delete the Teacher/Super Admin account', status: 403 };
    }

    if (LEADERSHIP_POSITIONS.includes(target.position)) {
      return {
        error: `${target.name} currently holds the ${target.position.replace('_', ' ')} position. Remove their position before deleting this account.`,
        status: 409,
      };
    }

    if (isLeadershipAdmin(requestingUser) && LEADERSHIP_POSITIONS.includes(target.position)) {
      return { error: 'Only the Teacher/Super Admin can delete leadership accounts', status: 403 };
    }

    // Delete from Supabase Auth — profiles row cascades automatically
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
    if (deleteError) {
      return { error: 'Failed to delete user account', status: 500 };
    }

    return { data: { id, name: target.name } };
  }

  // ── Mock fallback ───────────────────────────────────────────
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return { error: 'Member not found', status: 404 };
  const targetUser = users[index];
  if (targetUser.role === ROLES.TEACHER_ADMIN) {
    return { error: 'Cannot delete the Teacher/Super Admin account', status: 403 };
  }
  if (LEADERSHIP_POSITIONS.includes(targetUser.position)) {
    return {
      error: `${targetUser.name} currently holds the ${targetUser.position.replace('_', ' ')} position. Remove their position before deleting this account.`,
      status: 409,
    };
  }
  if (isLeadershipAdmin(requestingUser) && LEADERSHIP_POSITIONS.includes(targetUser.position)) {
    return { error: 'Only the Teacher/Super Admin can delete leadership accounts', status: 403 };
  }
  const deleted = users.splice(index, 1)[0];
  return { data: sanitizeUser(deleted) };
}

// ─── Position Management (Teacher-only) ──────────────────────

async function assignPosition(memberId, position, requestingUser) {
  if (!isTeacherAdmin(requestingUser)) {
    return { error: 'Only the Teacher/Super Admin can assign positions', status: 403 };
  }

  if (SUPABASE_READY) {
    const { data: member, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, role, position')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) return { error: 'Member not found', status: 404 };
    if (member.role === ROLES.TEACHER_ADMIN) {
      return { error: 'Cannot assign student positions to the Teacher account', status: 400 };
    }

    if (position === POSITIONS.NONE) return removePosition(memberId, requestingUser);

    if (!LEADERSHIP_POSITIONS.includes(position)) {
      return { error: `Invalid position. Must be one of: ${LEADERSHIP_POSITIONS.join(', ')}`, status: 400 };
    }

    // The unique partial index in the DB enforces one-holder-per-position.
    // We first strip the position from any current holder.
    const { data: currentHolder } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('position', position)
      .neq('id', memberId)
      .single();

    if (currentHolder) {
      await supabase.from('profiles').update({ position: 'none' }).eq('id', currentHolder.id);
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ position })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) return { error: updateError.message, status: 500 };
    return { data: updated, previousHolder: currentHolder || null };
  }

  // ── Mock fallback ───────────────────────────────────────────
  const member = users.find(u => u.id === memberId);
  if (!member) return { error: 'Member not found', status: 404 };
  if (member.role === ROLES.TEACHER_ADMIN) {
    return { error: 'Cannot assign student positions to the Teacher account', status: 400 };
  }
  if (position === POSITIONS.NONE) return removePosition(memberId, requestingUser);
  if (!LEADERSHIP_POSITIONS.includes(position)) {
    return { error: `Invalid position. Must be one of: ${LEADERSHIP_POSITIONS.join(', ')}`, status: 400 };
  }
  let previousHolder = null;
  const currentHolder = users.find(u => u.position === position && u.id !== memberId);
  if (currentHolder) {
    previousHolder = sanitizeUser(currentHolder);
    currentHolder.position = POSITIONS.NONE;
    currentHolder.updatedAt = now();
  }
  member.position = position;
  member.updatedAt = now();
  return { data: sanitizeUser(member), previousHolder };
}

async function removePosition(memberId, requestingUser) {
  if (!isTeacherAdmin(requestingUser)) {
    return { error: 'Only the Teacher/Super Admin can remove positions', status: 403 };
  }

  if (SUPABASE_READY) {
    const { data: member, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, position')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) return { error: 'Member not found', status: 404 };
    if (member.role === ROLES.TEACHER_ADMIN) {
      return { error: 'Cannot modify the Teacher account\'s position', status: 400 };
    }

    const previousPosition = member.position;
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ position: 'none' })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) return { error: updateError.message, status: 500 };
    return { data: updated, previousPosition };
  }

  // ── Mock fallback ───────────────────────────────────────────
  const member = users.find(u => u.id === memberId);
  if (!member) return { error: 'Member not found', status: 404 };
  if (member.role === ROLES.TEACHER_ADMIN) {
    return { error: 'Cannot modify the Teacher account\'s position', status: 400 };
  }
  const previousPosition = member.position;
  member.position = POSITIONS.NONE;
  member.updatedAt = now();
  return { data: sanitizeUser(member), previousPosition };
}

async function getLeadershipStatus() {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('position', LEADERSHIP_POSITIONS);

    if (error) throw new Error(error.message);

    const result = {};
    for (const pos of LEADERSHIP_POSITIONS) {
      result[pos] = data.find(u => u.position === pos) || null;
    }
    return { data: result };
  }

  // Mock fallback
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

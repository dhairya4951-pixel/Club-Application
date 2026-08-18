/**
 * Attendance Service
 * ==================
 * Attendance management — admin-controlled data with audit trail.
 *
 * SUPABASE MIGRATION:
 *   Replace array operations with:
 *     supabase.from('attendance').select/upsert
 */

const { attendance, users, activities } = require('../data/mockData');
const { generateId, now } = require('../utils/helpers');
const { sanitizeUser } = require('../models/User');

/**
 * Get attendance history for a specific member (their own view)
 */
function getMemberAttendance(memberId) {
  const memberRecords = attendance.filter(a => a.memberId === memberId);

  // Enrich with activity details
  const enriched = memberRecords.map(record => {
    const activity = activities.find(a => a.id === record.activityId);
    return {
      ...record,
      activity: activity ? {
        id: activity.id,
        title: activity.title,
        date: activity.date,
        category: activity.category,
        status: activity.status,
      } : null,
    };
  }).sort((a, b) => {
    const dateA = a.activity?.date || '';
    const dateB = b.activity?.date || '';
    return new Date(dateB) - new Date(dateA);
  });

  // Calculate stats
  const totalActivities = enriched.length;
  const attended = enriched.filter(r => r.status === 'present').length;
  const missed = enriched.filter(r => r.status === 'absent').length;
  const attendancePercentage = totalActivities > 0
    ? Math.round((attended / totalActivities) * 1000) / 10
    : 0;

  return {
    data: {
      stats: { totalActivities, attended, missed, attendancePercentage },
      records: enriched,
    },
  };
}

/**
 * Get attendance for a specific activity (admin view)
 */
function getActivityAttendance(activityId) {
  const activity = activities.find(a => a.id === activityId);
  if (!activity) {
    return { error: 'Activity not found', status: 404 };
  }

  const records = attendance.filter(a => a.activityId === activityId);

  // Enrich with member details
  const enriched = records.map(record => {
    const member = users.find(u => u.id === record.memberId);
    return {
      ...record,
      member: member ? sanitizeUser(member) : null,
    };
  });

  // If there are no records yet (new activity), create default ones
  if (enriched.length === 0) {
    const defaultRecords = users.map(user => ({
      id: generateId(),
      activityId,
      memberId: user.id,
      status: 'absent',
      updatedBy: null,
      updatedAt: null,
      member: sanitizeUser(user),
    }));
    return { data: { activity, records: defaultRecords } };
  }

  return { data: { activity, records: enriched } };
}

/**
 * Bulk update attendance for an activity (admin only)
 * Expects: { records: [{ memberId, status }] }
 */
function updateActivityAttendance(activityId, records, adminId) {
  const activity = activities.find(a => a.id === activityId);
  if (!activity) {
    return { error: 'Activity not found', status: 404 };
  }

  const timestamp = now();

  records.forEach(({ memberId, status }) => {
    const existingIndex = attendance.findIndex(
      a => a.activityId === activityId && a.memberId === memberId
    );

    if (existingIndex >= 0) {
      // Update existing record
      attendance[existingIndex].status = status;
      attendance[existingIndex].updatedBy = adminId;
      attendance[existingIndex].updatedAt = timestamp;
    } else {
      // Create new record
      attendance.push({
        id: generateId(),
        activityId,
        memberId,
        status,
        updatedBy: adminId,
        updatedAt: timestamp,
      });
    }
  });

  // Return updated attendance
  return getActivityAttendance(activityId);
}

module.exports = {
  getMemberAttendance,
  getActivityAttendance,
  updateActivityAttendance,
};

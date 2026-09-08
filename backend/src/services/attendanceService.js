/**
 * Attendance Service
 * ==================
 * Attendance management — admin-controlled data with audit trail.
 */

const { attendance, users, activities } = require('../data/mockData');
const { generateId, now } = require('../utils/helpers');
const { sanitizeUser } = require('../models/User');
const { supabase, SUPABASE_READY } = require('../config/supabase');

/**
 * Get attendance history for a specific member (their own view)
 */
async function getMemberAttendance(memberId) {
  if (SUPABASE_READY) {
    // We left join the attendance table with the activities table
    const { data: records, error } = await supabase
      .from('attendance')
      .select(`
        *,
        activity:activities (
          id, title, date, category, status
        )
      `)
      .eq('member_id', memberId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Sort by activity date descending
    const safeRecords = records || [];
    safeRecords.sort((a, b) => {
      const dateA = a.activity?.date || a.updated_at || '';
      const dateB = b.activity?.date || b.updated_at || '';
      return new Date(dateB) - new Date(dateA);
    });

    const totalActivities = records.length;
    const attended = records.filter(r => r.status === 'present').length;
    const missed = records.filter(r => r.status === 'absent').length;
    const attendancePercentage = totalActivities > 0
      ? Math.round((attended / totalActivities) * 1000) / 10
      : 0;

    return {
      data: {
        stats: { totalActivities, attended, missed, attendancePercentage },
        records,
      },
    };
  }

  // Mock Fallback
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
  }).filter(r => r.activity && r.activity.status === 'completed').sort((a, b) => {
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
async function getActivityAttendance(activityId) {
  if (SUPABASE_READY) {
    const { data: activity, error: actError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();
    
    if (actError || !activity) return { error: 'Activity not found', status: 404 };
    if (activity.status !== 'completed') return { error: 'Attendance can only be managed for completed activities.', status: 400 };

    // Fetch existing attendance records with member profile data
    const { data: records, error: recError } = await supabase
      .from('attendance')
      .select(`
        *,
        member:profiles!member_id (
          id, name, email, role, position, course, year, profile_image
        )
      `)
      .eq('activity_id', activityId);

    if (recError) throw new Error(recError.message);

    // If records exist, return them
    if (records && records.length > 0) {
      return { data: { activity, records } };
    }

    // Otherwise, generate default empty records for all members
    const { data: allMembers, error: membersError } = await supabase
      .from('profiles')
      .select('*');

    if (membersError) throw new Error(membersError.message);

    const defaultRecords = allMembers.map(member => ({
      activity_id: activityId,
      member_id: member.id,
      status: 'absent',
      updated_by: null,
      updated_at: null,
      member: member
    }));

    return { data: { activity, records: defaultRecords } };
  }

  // Mock Fallback
  const activity = activities.find(a => a.id === activityId);
  if (!activity) {
    return { error: 'Activity not found', status: 404 };
  }
  if (activity.status !== 'completed') {
    return { error: 'Attendance can only be managed for completed activities.', status: 400 };
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
async function updateActivityAttendance(activityId, records, adminId) {
  if (SUPABASE_READY) {
    const { data: activity, error: actError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (actError || !activity) return { error: 'Activity not found', status: 404 };
    if (activity.status !== 'completed') return { error: 'Attendance can only be managed for completed activities.', status: 400 };

    // Format for Supabase upsert (which relies on the unique constraint activity_id + member_id)
    const upsertData = records.map(r => ({
      activity_id: activityId,
      member_id: r.memberId || r.member_id,
      status: r.status,
      updated_by: adminId,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(upsertData, { onConflict: 'activity_id,member_id' });

    if (error) throw new Error(error.message);

    return getActivityAttendance(activityId);
  }

  // Mock Fallback
  const activity = activities.find(a => a.id === activityId);
  if (!activity) {
    return { error: 'Activity not found', status: 404 };
  }
  if (activity.status !== 'completed') {
    return { error: 'Attendance can only be managed for completed activities.', status: 400 };
  }

  const timestamp = now();

  records.forEach((r) => {
    const memberId = r.memberId || r.member_id;
    const existingIndex = attendance.findIndex(
      a => a.activityId === activityId && a.memberId === memberId
    );

    if (existingIndex >= 0) {
      // Update existing record
      attendance[existingIndex].status = r.status;
      attendance[existingIndex].updatedBy = adminId;
      attendance[existingIndex].updatedAt = timestamp;
    } else {
      // Create new record
      attendance.push({
        id: generateId(),
        activityId,
        memberId,
        status: r.status,
        updatedBy: adminId,
        updatedAt: timestamp,
      });
    }
  });

  return getActivityAttendance(activityId);
}

module.exports = {
  getMemberAttendance,
  getActivityAttendance,
  updateActivityAttendance,
};

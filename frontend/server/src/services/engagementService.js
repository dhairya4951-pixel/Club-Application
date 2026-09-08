/**
 * Engagement Service
 * ==================
 * Computes engagement metrics from existing data:
 *   - Attendance stats (from attendance records)
 *   - Discussion stats (from messages, with spam filtering)
 *   - Contribution stats (from contributionService)
 *   - Combined engagement summary
 */

const { attendance: mockAttendance, activities: mockActivities, messages: mockMessages, users: mockUsers } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const contributionService = require('./contributionService');
const { supabase, SUPABASE_READY } = require('../config/supabase');

// ─── Spam Filter ─────────────────────────────────────────
const SPAM_PATTERNS = /^(ok|yes|no|lol|lmao|haha|hahaha|ha|😂|👍|💯|nice|cool|true|ya|yep|yea|yeah|nah|nope|sure|thanks|thx|ty|k|hmm|mm|oh|ah|okay|np|gg|bruh|bro|ikr|fr|same|wow|omg|ooh|eh|meh|hi|hey|hello|bye)$/i;
const EMOJI_ONLY = /^[\p{Emoji}\s]+$/u;
const MIN_MEANINGFUL_LENGTH = 4;

function isMeaningfulMessage(messageText) {
  if (!messageText) return false;
  const text = messageText.trim();
  if (text.length < MIN_MEANINGFUL_LENGTH) return false;
  if (SPAM_PATTERNS.test(text)) return false;
  if (EMOJI_ONLY.test(text)) return false;
  return true;
}

// ─── Data Fetcher ────────────────────────────────────────

async function fetchEngagementData(memberId = null) {
  if (!SUPABASE_READY) {
    return {
      activities: mockActivities,
      attendance: mockAttendance,
      messages: mockMessages,
      users: mockUsers
    };
  }

  let attQuery = supabase.from('attendance').select('activity_id, member_id, status, updated_at');
  if (memberId) attQuery = attQuery.eq('member_id', memberId);

  let msgQuery = supabase.from('messages').select('sender_id, message, created_at');
  if (memberId) msgQuery = msgQuery.eq('sender_id', memberId);

  // Execute independent database queries concurrently in parallel
  const [
    { data: dbActivities },
    { data: dbAttendance },
    { data: dbMessages },
    { data: dbUsers }
  ] = await Promise.all([
    supabase.from('activities').select('id, title, status, date'),
    attQuery,
    msgQuery,
    supabase.from('profiles').select('id, name, email, role, position, profile_image')
  ]);

  return {
    activities: dbActivities ? dbActivities.map(a => ({ id: a.id, title: a.title, status: a.status, date: a.date })) : [],
    attendance: dbAttendance ? dbAttendance.map(a => ({ activityId: a.activity_id, memberId: a.member_id, status: a.status, updatedAt: a.updated_at })) : [],
    messages: dbMessages ? dbMessages.map(m => ({ senderId: m.sender_id, message: m.message, createdAt: m.created_at })) : [],
    users: dbUsers ? dbUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, position: u.position, profileImage: u.profile_image })) : []
  };
}

// ─── Attendance Stats ────────────────────────────────────

function computeAttendanceStats(memberId, activities, attendance) {
  const completedActivities = activities.filter(a => a.status === 'completed');
  const completedIds = new Set(completedActivities.map(a => a.id));

  const memberRecords = attendance.filter(
    a => a.memberId === memberId && completedIds.has(a.activityId)
  );

  const total = memberRecords.length;
  const attended = memberRecords.filter(r => r.status === 'present').length;
  const missed = memberRecords.filter(r => r.status === 'absent').length;
  const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

  let band;
  if (percentage >= 90) band = 'Excellent';
  else if (percentage >= 75) band = 'Good';
  else if (percentage >= 60) band = 'Moderate';
  else band = 'Low';

  return { total, attended, missed, percentage, band };
}

// ─── Discussion Stats ────────────────────────────────────

function computeDiscussionStats(memberId, messages) {
  const memberMessages = messages.filter(m => m.senderId === memberId);

  const totalMessages = memberMessages.length;
  const meaningfulMessages = memberMessages.filter(m => isMeaningfulMessage(m.message)).length;

  const activeDays = new Set(
    memberMessages.map(m => new Date(m.createdAt).toISOString().split('T')[0])
  ).size;

  return { totalMessages, meaningfulMessages, activeDays };
}

// ─── Engagement Summary ──────────────────────────────────

async function getEngagementSummary(memberId) {
  const data = await fetchEngagementData(memberId);
  
  const attendanceStats = computeAttendanceStats(memberId, data.activities, data.attendance);
  const discussionStats = computeDiscussionStats(memberId, data.messages);
  const contributionStats = await contributionService.getStats(memberId);

  const activityLevel = attendanceStats.band;
  const contributionLevel = contributionStats.level;

  let overallLabel;
  if (['Excellent', 'Good'].includes(activityLevel) && ['High', 'Moderate'].includes(contributionLevel)) {
    overallLabel = 'Highly Engaged';
  } else if (['Excellent', 'Good'].includes(activityLevel)) {
    overallLabel = 'Active';
  } else if (activityLevel === 'Moderate') {
    overallLabel = 'Moderately Active';
  } else {
    overallLabel = 'Low Participation';
  }

  return {
    attendance: attendanceStats,
    discussion: discussionStats,
    contribution: contributionStats,
    activityLevel,
    contributionLevel,
    overallLabel,
  };
}

// ─── All Members Overview ────────────────────────────────

async function getAllMemberEngagement() {
  const data = await fetchEngagementData(null);
  const members = data.users.filter(u => u.role !== 'teacher_admin');

  // We need to fetch contributions for all members. 
  // It's easier to loop using Promise.all
  const results = await Promise.all(members.map(async (member) => {
    const attendanceStats = computeAttendanceStats(member.id, data.activities, data.attendance);
    const discussionStats = computeDiscussionStats(member.id, data.messages);
    const contributionStats = await contributionService.getStats(member.id);

    const activityLevel = attendanceStats.band;
    const contributionLevel = contributionStats.level;

    let overallLabel;
    if (['Excellent', 'Good'].includes(activityLevel) && ['High', 'Moderate'].includes(contributionLevel)) {
      overallLabel = 'Highly Engaged';
    } else if (['Excellent', 'Good'].includes(activityLevel)) {
      overallLabel = 'Active';
    } else if (activityLevel === 'Moderate') {
      overallLabel = 'Moderately Active';
    } else {
      overallLabel = 'Low Participation';
    }

    return {
      member: sanitizeUser(member),
      attendance: attendanceStats,
      discussion: discussionStats,
      contribution: contributionStats,
      activityLevel,
      contributionLevel,
      overallLabel
    };
  }));

  return results.sort((a, b) => {
    if (b.contribution.totalPoints !== a.contribution.totalPoints) {
      return b.contribution.totalPoints - a.contribution.totalPoints;
    }
    return b.attendance.percentage - a.attendance.percentage;
  });
}

// ─── Timeline ────────────────────────────────────────────

async function getTimeline(memberId) {
  const data = await fetchEngagementData(memberId);
  
  const completedActivities = data.activities.filter(a => a.status === 'completed');
  const completedIds = new Set(completedActivities.map(a => a.id));

  const attendanceEvents = data.attendance
    .filter(a => a.memberId === memberId && completedIds.has(a.activityId))
    .map(record => {
      const activity = data.activities.find(a => a.id === record.activityId);
      return {
        type: 'attendance',
        date: activity?.date || record.updatedAt,
        icon: record.status === 'present' ? '✓' : '✗',
        title: activity?.title || 'Unknown Activity',
        status: record.status,
        points: null,
      };
    });

  const memberContributions = await contributionService.getByMember(memberId);
  const contributionEvents = memberContributions.map(c => ({
    type: 'contribution',
    date: c.date,
    icon: c.categoryIcon,
    title: c.title,
    status: null,
    points: c.points,
    category: c.category,
    typeLabel: c.typeLabel,
    recorder: c.recorder,
  }));

  return [...attendanceEvents, ...contributionEvents]
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  getEngagementSummary,
  getAllMemberEngagement,
  getTimeline,
  isMeaningfulMessage,
};

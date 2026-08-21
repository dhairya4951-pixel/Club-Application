/**
 * Engagement Service
 * ==================
 * Computes engagement metrics from existing data:
 *   - Attendance stats (from attendance records)
 *   - Discussion stats (from messages, with spam filtering)
 *   - Contribution stats (from contributionService)
 *   - Combined engagement summary
 *
 * All calculations are derived — no stored totals.
 *
 * SUPABASE MIGRATION:
 *   Replace array filtering with SQL aggregation queries
 */

const { attendance, activities, messages, users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const contributionService = require('./contributionService');

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

// ─── Attendance Stats ────────────────────────────────────

function getAttendanceStats(memberId) {
  // Only count completed (non-cancelled) activities
  const completedActivities = activities.filter(a => a.status === 'completed');
  const completedIds = new Set(completedActivities.map(a => a.id));

  const memberRecords = attendance.filter(
    a => a.memberId === memberId && completedIds.has(a.activityId)
  );

  const total = memberRecords.length;
  const attended = memberRecords.filter(r => r.status === 'present').length;
  const missed = memberRecords.filter(r => r.status === 'absent').length;
  const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

  // Activity band
  let band;
  if (percentage >= 90) band = 'Excellent';
  else if (percentage >= 75) band = 'Good';
  else if (percentage >= 60) band = 'Moderate';
  else band = 'Low';

  return {
    total,
    attended,
    missed,
    percentage,
    band,
  };
}

// ─── Discussion Stats ────────────────────────────────────

function getDiscussionStats(memberId) {
  const memberMessages = messages.filter(m => m.senderId === memberId);

  const totalMessages = memberMessages.length;
  const meaningfulMessages = memberMessages.filter(m => isMeaningfulMessage(m.message)).length;

  // Calculate active discussion days
  const activeDays = new Set(
    memberMessages.map(m => new Date(m.createdAt).toISOString().split('T')[0])
  ).size;

  return {
    totalMessages,
    meaningfulMessages,
    activeDays,
  };
}

// ─── Engagement Summary ──────────────────────────────────

function getEngagementSummary(memberId) {
  const attendanceStats = getAttendanceStats(memberId);
  const discussionStats = getDiscussionStats(memberId);
  const contributionStats = contributionService.getStats(memberId);

  // Overall engagement label
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

function getAllMemberEngagement() {
  // Exclude teacher from engagement ranking (they're the advisor)
  const members = users.filter(u => u.role !== 'teacher_admin');

  return members.map(member => {
    const summary = getEngagementSummary(member.id);
    return {
      member: sanitizeUser(member),
      ...summary,
    };
  }).sort((a, b) => {
    // Sort by contribution points desc, then attendance desc
    if (b.contribution.totalPoints !== a.contribution.totalPoints) {
      return b.contribution.totalPoints - a.contribution.totalPoints;
    }
    return b.attendance.percentage - a.attendance.percentage;
  });
}

// ─── Timeline ────────────────────────────────────────────
// Merges attendance records and contributions into a single chronological feed

function getTimeline(memberId) {
  const completedActivities = activities.filter(a => a.status === 'completed');
  const completedIds = new Set(completedActivities.map(a => a.id));

  // Attendance events
  const attendanceEvents = attendance
    .filter(a => a.memberId === memberId && completedIds.has(a.activityId))
    .map(record => {
      const activity = activities.find(a => a.id === record.activityId);
      return {
        type: 'attendance',
        date: activity?.date || record.updatedAt,
        icon: record.status === 'present' ? '✓' : '✗',
        title: activity?.title || 'Unknown Activity',
        status: record.status,
        points: null,
      };
    });

  // Contribution events
  const contributionEvents = contributionService.getByMember(memberId).map(c => ({
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

  // Merge and sort by date descending
  return [...attendanceEvents, ...contributionEvents]
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = {
  getAttendanceStats,
  getDiscussionStats,
  getEngagementSummary,
  getAllMemberEngagement,
  getTimeline,
  isMeaningfulMessage,
};

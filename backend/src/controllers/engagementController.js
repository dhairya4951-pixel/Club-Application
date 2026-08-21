/**
 * Engagement Controller
 * =====================
 * Serves engagement metrics: attendance, discussion, contribution stats.
 */

const engagementService = require('../services/engagementService');

function getMyEngagement(req, res) {
  const summary = engagementService.getEngagementSummary(req.user.id);
  res.json({ data: summary });
}

function getMemberEngagement(req, res) {
  const { memberId } = req.params;
  const summary = engagementService.getEngagementSummary(memberId);
  res.json({ data: summary });
}

function getAllEngagement(req, res) {
  const data = engagementService.getAllMemberEngagement();
  res.json({ data });
}

function getTimeline(req, res) {
  const { memberId } = req.params;

  // Members can see their own; admins can see anyone
  const isOwnData = req.user.id === memberId;
  const isAdmin = req.user.role === 'teacher_admin' ||
    ['president', 'vice_president', 'general_secretary'].includes(req.user.position);

  if (!isOwnData && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const timeline = engagementService.getTimeline(memberId);
  res.json({ data: timeline });
}

module.exports = {
  getMyEngagement,
  getMemberEngagement,
  getAllEngagement,
  getTimeline,
};

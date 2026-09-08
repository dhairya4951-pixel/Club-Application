/**
 * Engagement Controller
 * =====================
 * Serves engagement metrics: attendance, discussion, contribution stats.
 */

const engagementService = require('../services/engagementService');

async function getMyEngagement(req, res) {
  try {
    const summary = await engagementService.getEngagementSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMemberEngagement(req, res) {
  const { memberId } = req.params;
  try {
    const summary = await engagementService.getEngagementSummary(memberId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllEngagement(req, res) {
  try {
    const data = await engagementService.getAllMemberEngagement();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTimeline(req, res) {
  const { memberId } = req.params;

  // Members can see their own; admins can see anyone
  const isOwnData = req.user.id === memberId;
  const isAdmin = req.user.role === 'teacher_admin' ||
    ['president', 'vice_president', 'general_secretary'].includes(req.user.position);

  if (!isOwnData && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const timeline = await engagementService.getTimeline(memberId);
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMyEngagement,
  getMemberEngagement,
  getAllEngagement,
  getTimeline,
};

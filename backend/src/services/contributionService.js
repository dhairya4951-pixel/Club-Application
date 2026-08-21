/**
 * Contribution Service
 * ====================
 * CRUD operations for member contributions with audit trail.
 * Points are auto-derived from contribution type — never manually entered.
 *
 * SUPABASE MIGRATION:
 *   Replace array operations with:
 *     supabase.from('contributions').select/insert/update/delete
 *     supabase.from('audit_log').insert
 */

const { contributions, auditLog, users, CONTRIBUTION_TYPES, CONTRIBUTION_CATEGORIES } = require('../data/mockData');
const { generateId, now } = require('../utils/helpers');
const { sanitizeUser } = require('../models/User');

// ─── Type Definitions ────────────────────────────────────

function getTypes() {
  return {
    types: CONTRIBUTION_TYPES,
    categories: CONTRIBUTION_CATEGORIES,
  };
}

function getPointsForType(contributionType) {
  const typeDef = CONTRIBUTION_TYPES[contributionType];
  if (!typeDef) return null;
  return typeDef.points;
}

// ─── Audit Logging ───────────────────────────────────────

function logAudit(action, entityId, performedBy, details) {
  const entry = {
    id: generateId(),
    action,
    entityType: 'contribution',
    entityId,
    performedBy,
    performedAt: now(),
    details,
  };
  auditLog.push(entry);
  return entry;
}

// ─── CRUD ────────────────────────────────────────────────

function getAll() {
  return contributions
    .map(enrichContribution)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getByMember(memberId) {
  return contributions
    .filter(c => c.memberId === memberId)
    .map(enrichContribution)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getById(id) {
  const c = contributions.find(c => c.id === id);
  if (!c) return null;
  return enrichContribution(c);
}

function create(data, adminId) {
  // Validate contribution type
  const typeDef = CONTRIBUTION_TYPES[data.contributionType];
  if (!typeDef) {
    return { error: `Invalid contribution type: ${data.contributionType}`, status: 400 };
  }

  // Validate member exists
  const member = users.find(u => u.id === data.memberId);
  if (!member) {
    return { error: 'Member not found', status: 404 };
  }

  // Self-award prevention (non-teacher admins cannot award themselves)
  const admin = users.find(u => u.id === adminId);
  if (data.memberId === adminId && admin?.role !== 'teacher_admin') {
    return { error: 'You cannot award contribution points to yourself', status: 403 };
  }

  const contribution = {
    id: generateId(),
    memberId: data.memberId,
    category: typeDef.category,
    contributionType: data.contributionType,
    title: data.title.trim(),
    description: data.description.trim(),
    points: typeDef.points,
    date: data.date,
    recordedBy: adminId,
    recordedAt: now(),
    updatedBy: null,
    updatedAt: null,
    attachmentUrl: data.attachmentUrl || null,
    externalLink: data.externalLink || null,
  };

  contributions.push(contribution);

  logAudit('CREATE', contribution.id, adminId, {
    title: contribution.title,
    points: contribution.points,
    contributionType: contribution.contributionType,
    memberId: contribution.memberId,
  });

  return { data: enrichContribution(contribution) };
}

function update(id, data, adminId) {
  const index = contributions.findIndex(c => c.id === id);
  if (index === -1) {
    return { error: 'Contribution not found', status: 404 };
  }

  const existing = contributions[index];
  const changes = {};

  // If changing type, recalculate points
  if (data.contributionType && data.contributionType !== existing.contributionType) {
    const typeDef = CONTRIBUTION_TYPES[data.contributionType];
    if (!typeDef) {
      return { error: `Invalid contribution type: ${data.contributionType}`, status: 400 };
    }
    changes.contributionType = data.contributionType;
    changes.category = typeDef.category;
    changes.points = typeDef.points;
  }

  if (data.title) changes.title = data.title.trim();
  if (data.description) changes.description = data.description.trim();
  if (data.date) changes.date = data.date;
  if (data.attachmentUrl !== undefined) changes.attachmentUrl = data.attachmentUrl || null;
  if (data.externalLink !== undefined) changes.externalLink = data.externalLink || null;

  // Track who edited
  changes.updatedBy = adminId;
  changes.updatedAt = now();

  Object.assign(contributions[index], changes);

  logAudit('UPDATE', id, adminId, {
    previousValues: {
      title: existing.title,
      points: existing.points,
      contributionType: existing.contributionType,
    },
    newValues: changes,
  });

  return { data: enrichContribution(contributions[index]) };
}

function remove(id, adminId) {
  const index = contributions.findIndex(c => c.id === id);
  if (index === -1) {
    return { error: 'Contribution not found', status: 404 };
  }

  const deleted = contributions.splice(index, 1)[0];

  logAudit('DELETE', id, adminId, {
    title: deleted.title,
    points: deleted.points,
    memberId: deleted.memberId,
    contributionType: deleted.contributionType,
  });

  return { data: deleted };
}

// ─── Statistics ──────────────────────────────────────────

function getStats(memberId) {
  const memberContribs = contributions.filter(c => c.memberId === memberId);

  const totalPoints = memberContribs.reduce((sum, c) => sum + c.points, 0);
  const taskCount = memberContribs.filter(c => c.category === 'TASK').length;
  const resourceCount = memberContribs.filter(c => c.category === 'RESOURCE').length;
  const eventSupportCount = memberContribs.filter(c => c.category === 'EVENT_SUPPORT').length;
  const eventOrganizedCount = memberContribs.filter(c => c.category === 'EVENT_ORGANIZED').length;
  const majorCount = memberContribs.filter(c => c.category === 'MAJOR_RESPONSIBILITY').length;

  // Contribution level band
  let level;
  if (totalPoints >= 30) level = 'High';
  else if (totalPoints >= 15) level = 'Moderate';
  else if (totalPoints >= 1) level = 'Emerging';
  else level = 'None';

  return {
    totalPoints,
    taskCount,
    resourceCount,
    eventSupportCount,
    eventOrganizedCount,
    majorCount,
    totalContributions: memberContribs.length,
    level,
  };
}

// ─── Helpers ─────────────────────────────────────────────

function enrichContribution(c) {
  const member = users.find(u => u.id === c.memberId);
  const recorder = users.find(u => u.id === c.recordedBy);
  const updater = c.updatedBy ? users.find(u => u.id === c.updatedBy) : null;
  const typeDef = CONTRIBUTION_TYPES[c.contributionType];
  const categoryDef = CONTRIBUTION_CATEGORIES[c.category];

  return {
    ...c,
    member: member ? sanitizeUser(member) : null,
    recorder: recorder ? { id: recorder.id, name: recorder.name } : null,
    updater: updater ? { id: updater.id, name: updater.name } : null,
    typeLabel: typeDef?.label || c.contributionType,
    categoryLabel: categoryDef?.label || c.category,
    categoryIcon: categoryDef?.icon || '📋',
  };
}

function getAuditLog(entityId) {
  return auditLog
    .filter(a => a.entityId === entityId)
    .map(a => {
      const performer = users.find(u => u.id === a.performedBy);
      return {
        ...a,
        performerName: performer?.name || 'Unknown',
      };
    })
    .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt));
}

module.exports = {
  getTypes,
  getPointsForType,
  getAll,
  getByMember,
  getById,
  create,
  update,
  remove,
  getStats,
  getAuditLog,
};

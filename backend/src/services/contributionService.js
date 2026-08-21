/**
 * Contribution Service
 * ====================
 * CRUD operations for member contributions with audit trail.
 * Points are auto-derived from contribution type — never manually entered.
 */

const { contributions, auditLog, users, CONTRIBUTION_TYPES, CONTRIBUTION_CATEGORIES } = require('../data/mockData');
const { generateId, now } = require('../utils/helpers');
const { sanitizeUser } = require('../models/User');
const { supabase, SUPABASE_READY } = require('../config/supabase');

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

async function logAudit(action, entityId, performedBy, details) {
  if (SUPABASE_READY) {
    await supabase.from('audit_logs').insert({
      action,
      entity_type: 'contribution',
      entity_id: entityId,
      performed_by: performedBy,
      details,
    });
    return;
  }

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
}

// ─── Helpers ─────────────────────────────────────────────

function formatSupabaseContribution(c) {
  const typeDef = CONTRIBUTION_TYPES[c.contribution_type];
  const categoryDef = CONTRIBUTION_CATEGORIES[c.category];

  return {
    id: c.id,
    memberId: c.member_id,
    category: c.category,
    contributionType: c.contribution_type,
    title: c.title,
    description: c.description,
    points: c.points,
    date: c.date,
    recordedBy: c.recorded_by,
    recordedAt: c.recorded_at,
    updatedBy: c.updated_by,
    updatedAt: c.updated_at,
    attachmentUrl: c.attachment_url,
    externalLink: c.external_link,
    member: c.member ? {
      id: c.member.id,
      name: c.member.name,
      profileImage: c.member.profile_image,
      position: c.member.position
    } : null,
    recorder: c.recorder ? { id: c.recorder.id, name: c.recorder.name } : null,
    updater: c.updater ? { id: c.updater.id, name: c.updater.name } : null,
    typeLabel: typeDef?.label || c.contribution_type,
    categoryLabel: categoryDef?.label || c.category,
    categoryIcon: categoryDef?.icon || '📋',
  };
}

function enrichMockContribution(c) {
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

// ─── CRUD ────────────────────────────────────────────────

async function getAll() {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        member:profiles!member_id(id, name, profile_image, position),
        recorder:profiles!recorded_by(id, name),
        updater:profiles!updated_by(id, name)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(formatSupabaseContribution);
  }

  return contributions
    .map(enrichMockContribution)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function getByMember(memberId) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        member:profiles!member_id(id, name, profile_image, position),
        recorder:profiles!recorded_by(id, name),
        updater:profiles!updated_by(id, name)
      `)
      .eq('member_id', memberId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(formatSupabaseContribution);
  }

  return contributions
    .filter(c => c.memberId === memberId)
    .map(enrichMockContribution)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function getById(id) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        *,
        member:profiles!member_id(id, name, profile_image, position),
        recorder:profiles!recorded_by(id, name),
        updater:profiles!updated_by(id, name)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return formatSupabaseContribution(data);
  }

  const c = contributions.find(c => c.id === id);
  if (!c) return null;
  return enrichMockContribution(c);
}

async function create(data, adminId) {
  const typeDef = CONTRIBUTION_TYPES[data.contributionType];
  if (!typeDef) return { error: `Invalid contribution type: ${data.contributionType}`, status: 400 };

  if (SUPABASE_READY) {
    // Validate admin is not awarding to themselves unless they are teacher_admin
    const { data: adminProf } = await supabase.from('profiles').select('role').eq('id', adminId).single();
    if (data.memberId === adminId && adminProf?.role !== 'teacher_admin') {
      return { error: 'You cannot award contribution points to yourself', status: 403 };
    }

    const { data: inserted, error } = await supabase
      .from('contributions')
      .insert({
        member_id: data.memberId,
        category: typeDef.category,
        contribution_type: data.contributionType,
        title: data.title.trim(),
        description: data.description.trim(),
        points: typeDef.points,
        date: data.date,
        recorded_by: adminId,
        attachment_url: data.attachmentUrl || null,
        external_link: data.externalLink || null
      })
      .select(`
        *,
        member:profiles!member_id(id, name, profile_image, position),
        recorder:profiles!recorded_by(id, name),
        updater:profiles!updated_by(id, name)
      `)
      .single();

    if (error) return { error: error.message, status: 500 };

    await logAudit('CREATE', inserted.id, adminId, {
      title: inserted.title,
      points: inserted.points,
      contributionType: inserted.contribution_type,
      memberId: inserted.member_id,
    });

    return { data: formatSupabaseContribution(inserted) };
  }

  // Mock Fallback
  const member = users.find(u => u.id === data.memberId);
  if (!member) return { error: 'Member not found', status: 404 };

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

  await logAudit('CREATE', contribution.id, adminId, {
    title: contribution.title,
    points: contribution.points,
    contributionType: contribution.contributionType,
    memberId: contribution.memberId,
  });

  return { data: enrichMockContribution(contribution) };
}

async function update(id, data, adminId) {
  if (SUPABASE_READY) {
    const { data: existing } = await supabase.from('contributions').select('*').eq('id', id).single();
    if (!existing) return { error: 'Contribution not found', status: 404 };

    const changes = { updated_by: adminId, updated_at: new Date().toISOString() };
    
    if (data.contributionType && data.contributionType !== existing.contribution_type) {
      const typeDef = CONTRIBUTION_TYPES[data.contributionType];
      if (!typeDef) return { error: `Invalid contribution type: ${data.contributionType}`, status: 400 };
      changes.contribution_type = data.contributionType;
      changes.category = typeDef.category;
      changes.points = typeDef.points;
    }

    if (data.title) changes.title = data.title.trim();
    if (data.description) changes.description = data.description.trim();
    if (data.date) changes.date = data.date;
    if (data.attachmentUrl !== undefined) changes.attachment_url = data.attachmentUrl || null;
    if (data.externalLink !== undefined) changes.external_link = data.externalLink || null;

    const { data: updated, error } = await supabase
      .from('contributions')
      .update(changes)
      .eq('id', id)
      .select(`
        *,
        member:profiles!member_id(id, name, profile_image, position),
        recorder:profiles!recorded_by(id, name),
        updater:profiles!updated_by(id, name)
      `)
      .single();

    if (error) return { error: error.message, status: 500 };

    await logAudit('UPDATE', id, adminId, {
      previousValues: {
        title: existing.title,
        points: existing.points,
        contributionType: existing.contribution_type,
      },
      newValues: changes,
    });

    return { data: formatSupabaseContribution(updated) };
  }

  // Mock Fallback
  const index = contributions.findIndex(c => c.id === id);
  if (index === -1) return { error: 'Contribution not found', status: 404 };

  const existing = contributions[index];
  const changes = {};

  if (data.contributionType && data.contributionType !== existing.contributionType) {
    const typeDef = CONTRIBUTION_TYPES[data.contributionType];
    if (!typeDef) return { error: `Invalid contribution type: ${data.contributionType}`, status: 400 };
    changes.contributionType = data.contributionType;
    changes.category = typeDef.category;
    changes.points = typeDef.points;
  }

  if (data.title) changes.title = data.title.trim();
  if (data.description) changes.description = data.description.trim();
  if (data.date) changes.date = data.date;
  if (data.attachmentUrl !== undefined) changes.attachmentUrl = data.attachmentUrl || null;
  if (data.externalLink !== undefined) changes.externalLink = data.externalLink || null;

  changes.updatedBy = adminId;
  changes.updatedAt = now();

  Object.assign(contributions[index], changes);

  await logAudit('UPDATE', id, adminId, {
    previousValues: {
      title: existing.title,
      points: existing.points,
      contributionType: existing.contributionType,
    },
    newValues: changes,
  });

  return { data: enrichMockContribution(contributions[index]) };
}

async function remove(id, adminId) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase.from('contributions').delete().eq('id', id).select().single();
    if (error) return { error: error.message, status: 500 };
    if (!data) return { error: 'Contribution not found', status: 404 };

    await logAudit('DELETE', id, adminId, {
      title: data.title,
      points: data.points,
      memberId: data.member_id,
      contributionType: data.contribution_type,
    });

    return { data };
  }

  const index = contributions.findIndex(c => c.id === id);
  if (index === -1) return { error: 'Contribution not found', status: 404 };

  const deleted = contributions.splice(index, 1)[0];
  await logAudit('DELETE', id, adminId, {
    title: deleted.title,
    points: deleted.points,
    memberId: deleted.memberId,
    contributionType: deleted.contributionType,
  });

  return { data: deleted };
}

// ─── Statistics ──────────────────────────────────────────

async function getStats(memberId) {
  let memberContribs = [];

  if (SUPABASE_READY) {
    const { data } = await supabase.from('contributions').select('*').eq('member_id', memberId);
    if (data) memberContribs = data.map(c => ({ points: c.points, category: c.category }));
  } else {
    memberContribs = contributions.filter(c => c.memberId === memberId);
  }

  const totalPoints = memberContribs.reduce((sum, c) => sum + c.points, 0);
  const taskCount = memberContribs.filter(c => c.category === 'TASK').length;
  const resourceCount = memberContribs.filter(c => c.category === 'RESOURCE').length;
  const eventSupportCount = memberContribs.filter(c => c.category === 'EVENT_SUPPORT').length;
  const eventOrganizedCount = memberContribs.filter(c => c.category === 'EVENT_ORGANIZED').length;
  const majorCount = memberContribs.filter(c => c.category === 'MAJOR_RESPONSIBILITY').length;

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

async function getAuditLog(entityId) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, performer:profiles!performed_by(id, name)')
      .eq('entity_id', entityId)
      .order('performed_at', { ascending: false });
    
    if (error) return [];
    return data.map(a => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      performedBy: a.performed_by,
      performedAt: a.performed_at,
      details: a.details,
      performerName: a.performer?.name || 'Unknown'
    }));
  }

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

/**
 * Contribution Controller
 * =======================
 * Handles contribution CRUD operations.
 * Authorization enforced via middleware + self-award check.
 */

const contributionService = require('../services/contributionService');

function getTypes(req, res) {
  res.json(contributionService.getTypes());
}

async function getAll(req, res) {
  const data = await contributionService.getAll();
  res.json(data);
}

async function getByMember(req, res) {
  const { memberId } = req.params;

  // Members can see their own; admins can see anyone
  const isOwnData = req.user.id === memberId;
  const isAdmin = req.user.role === 'teacher_admin' ||
    ['president', 'vice_president', 'general_secretary'].includes(req.user.position);

  if (!isOwnData && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const data = await contributionService.getByMember(memberId);
  res.json(data);
}

async function getById(req, res) {
  const contribution = await contributionService.getById(req.params.id);
  if (!contribution) {
    return res.status(404).json({ error: 'Contribution not found' });
  }
  res.json(contribution);
}

async function create(req, res) {
  const { memberId, contributionType, title, description, date, attachmentUrl, externalLink } = req.body;

  if (!memberId || !contributionType || !title || !description || !date) {
    return res.status(400).json({ error: 'Missing required fields: memberId, contributionType, title, description, date' });
  }

  const result = await contributionService.create(
    { memberId, contributionType, title, description, date, attachmentUrl, externalLink },
    req.user.id
  );

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.status(201).json(result);
}

async function update(req, res) {
  const result = await contributionService.update(req.params.id, req.body, req.user.id);

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json(result);
}

async function remove(req, res) {
  const result = await contributionService.remove(req.params.id, req.user.id);

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json({ message: 'Contribution deleted', data: result.data });
}

async function getAuditLog(req, res) {
  const log = await contributionService.getAuditLog(req.params.id);
  res.json(log);
}

module.exports = {
  getTypes,
  getAll,
  getByMember,
  getById,
  create,
  update,
  remove,
  getAuditLog,
};

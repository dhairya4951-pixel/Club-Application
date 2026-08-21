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

function getAll(req, res) {
  const data = contributionService.getAll();
  res.json(data);
}

function getByMember(req, res) {
  const { memberId } = req.params;

  // Members can see their own; admins can see anyone
  const isOwnData = req.user.id === memberId;
  const isAdmin = req.user.role === 'teacher_admin' ||
    ['president', 'vice_president', 'general_secretary'].includes(req.user.position);

  if (!isOwnData && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const data = contributionService.getByMember(memberId);
  res.json(data);
}

function getById(req, res) {
  const contribution = contributionService.getById(req.params.id);
  if (!contribution) {
    return res.status(404).json({ error: 'Contribution not found' });
  }
  res.json(contribution);
}

function create(req, res) {
  const { memberId, contributionType, title, description, date, attachmentUrl, externalLink } = req.body;

  if (!memberId || !contributionType || !title || !description || !date) {
    return res.status(400).json({ error: 'Missing required fields: memberId, contributionType, title, description, date' });
  }

  const result = contributionService.create(
    { memberId, contributionType, title, description, date, attachmentUrl, externalLink },
    req.user.id
  );

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.status(201).json(result);
}

function update(req, res) {
  const result = contributionService.update(req.params.id, req.body, req.user.id);

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json(result);
}

function remove(req, res) {
  const result = contributionService.remove(req.params.id, req.user.id);

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  res.json({ message: 'Contribution deleted', data: result.data });
}

function getAuditLog(req, res) {
  const log = contributionService.getAuditLog(req.params.id);
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

/**
 * Member Controller
 */

const memberService = require('../services/memberService');
const { validateCreateMember, validateUpdateMember, validatePositionAssignment } = require('../validators/memberValidator');

function getAll(req, res, next) {
  try {
    const { search, role } = req.query;

    if (search) {
      const result = memberService.searchMembers(search);
      return res.json(result.data);
    }

    if (role) {
      const result = memberService.filterByRole(role);
      return res.json(result.data);
    }

    const result = memberService.getAllMembers();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const result = memberService.getMemberById(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const errors = validateCreateMember(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = memberService.createMember(req.body, req.user);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const errors = validateUpdateMember(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = memberService.updateMember(req.params.id, req.body, req.user);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const result = memberService.deleteMember(req.params.id, req.user);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ message: 'Member deleted successfully', data: result.data });
  } catch (err) {
    next(err);
  }
}

// ─── Position Management (Teacher-only) ──────────────────

function assignPosition(req, res, next) {
  try {
    const errors = validatePositionAssignment(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = memberService.assignPosition(req.params.id, req.body.position, req.user);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({
      message: 'Position assigned successfully',
      data: result.data,
      previousHolder: result.previousHolder || null,
    });
  } catch (err) {
    next(err);
  }
}

function removePosition(req, res, next) {
  try {
    const result = memberService.removePosition(req.params.id, req.user);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({
      message: 'Position removed successfully',
      data: result.data,
      previousPosition: result.previousPosition,
    });
  } catch (err) {
    next(err);
  }
}

function getLeadershipStatus(req, res, next) {
  try {
    const result = memberService.getLeadershipStatus();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, assignPosition, removePosition, getLeadershipStatus };

/**
 * Activity Controller
 */

const activityService = require('../services/activityService');
const { validateCreateActivity, validateUpdateActivity } = require('../validators/activityValidator');

function getAll(req, res, next) {
  try {
    const result = activityService.getAllActivities();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function getUpcoming(req, res, next) {
  try {
    const result = activityService.getUpcomingActivities();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function getPast(req, res, next) {
  try {
    const result = activityService.getPastActivities();
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const result = activityService.getActivityById(req.params.id);
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
    const errors = validateCreateActivity(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = activityService.createActivity({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json(result.data);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const errors = validateUpdateActivity(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = activityService.updateActivity(req.params.id, req.body);
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
    const result = activityService.deleteActivity(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ message: 'Activity deleted successfully', data: result.data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getUpcoming, getPast, getById, create, update, remove };

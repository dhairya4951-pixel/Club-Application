/**
 * Activity Controller
 */

const activityService = require('../services/activityService');
const { validateCreateActivity, validateUpdateActivity } = require('../validators/activityValidator');
const { camelizeKeys } = require('../utils/responseHelpers');

async function getAll(req, res, next) {
  try {
    const result = await activityService.getAllActivities();
    res.json(camelizeKeys(result.data));
  } catch (err) {
    next(err);
  }
}

async function getUpcoming(req, res, next) {
  try {
    const result = await activityService.getUpcomingActivities();
    res.json(camelizeKeys(result.data));
  } catch (err) {
    next(err);
  }
}

async function getPast(req, res, next) {
  try {
    const result = await activityService.getPastActivities();
    res.json(camelizeKeys(result.data));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await activityService.getActivityById(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(camelizeKeys(result.data));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validateCreateActivity(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = await activityService.createActivity({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json(camelizeKeys(result.data));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const errors = validateUpdateActivity(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const result = await activityService.updateActivity(req.params.id, req.body);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(camelizeKeys(result.data));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await activityService.deleteActivity(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ message: 'Activity deleted successfully', data: result.data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getUpcoming, getPast, getById, create, update, remove };

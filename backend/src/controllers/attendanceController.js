/**
 * Attendance Controller
 */

const attendanceService = require('../services/attendanceService');

function getMyAttendance(req, res, next) {
  try {
    const result = attendanceService.getMemberAttendance(req.user.id);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function getActivityAttendance(req, res, next) {
  try {
    const result = attendanceService.getActivityAttendance(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function updateActivityAttendance(req, res, next) {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    const result = attendanceService.updateActivityAttendance(
      req.params.id,
      records,
      req.user.id
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyAttendance, getActivityAttendance, updateActivityAttendance };

/**
 * Attendance Controller
 */

const attendanceService = require('../services/attendanceService');

async function getMyAttendance(req, res, next) {
  try {
    const result = await attendanceService.getMemberAttendance(req.user.id);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

async function getActivityAttendance(req, res, next) {
  try {
    const result = await attendanceService.getActivityAttendance(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

async function updateActivityAttendance(req, res, next) {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    const result = await attendanceService.updateActivityAttendance(
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

/**
 * Activity Model
 * Defines the shape of Activity/Event data and status constants.
 */

const ACTIVITY_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const ACTIVITY_CATEGORIES = [
  'Workshop',
  'Meeting',
  'Lecture',
  'Competition',
  'Screening',
  'Field Visit',
  'Orientation',
  'Social',
  'Other',
];

module.exports = {
  ACTIVITY_STATUS,
  ACTIVITY_CATEGORIES,
};

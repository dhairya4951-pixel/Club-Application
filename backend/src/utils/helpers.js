/**
 * Utility Helpers
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a new UUID
 */
function generateId() {
  return uuidv4();
}

/**
 * Get current ISO timestamp
 */
function now() {
  return new Date().toISOString();
}

/**
 * Paginate an array (for future use)
 */
function paginate(array, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return {
    data: array.slice(offset, offset + limit),
    total: array.length,
    page,
    limit,
    totalPages: Math.ceil(array.length / limit),
  };
}

module.exports = {
  generateId,
  now,
  paginate,
};

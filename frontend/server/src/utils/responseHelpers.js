/**
 * Response Helpers
 * ================
 * Converts snake_case Supabase column names to camelCase
 * for consistent frontend consumption.
 */

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase.
 * Handles nested objects and arrays.
 */
function camelizeKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelizeKeys);
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        snakeToCamel(key),
        camelizeKeys(value),
      ])
    );
  }
  return obj;
}

module.exports = { camelizeKeys };

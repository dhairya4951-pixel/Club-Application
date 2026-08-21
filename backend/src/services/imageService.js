/**
 * Image Service — Storage Abstraction
 * ====================================
 * Centralizes all image upload/delete/URL operations.
 *
 * SUPABASE MIGRATION:
 *   Replace the local fs operations with:
 *     supabase.storage.from(bucket).upload(path, buffer, { contentType })
 *     supabase.storage.from(bucket).remove([path])
 *     supabase.storage.from(bucket).getPublicUrl(path)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Constants ───────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// ─── Validation ──────────────────────────────────

/**
 * Validate an image file buffer and metadata.
 * Returns { valid: true } or { valid: false, error: '...' }
 */
function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Please upload a valid JPG, PNG, or WEBP image.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` };
  }

  // Extra safety: check magic bytes
  const header = file.buffer.slice(0, 4);
  const isJPEG = header[0] === 0xFF && header[1] === 0xD8;
  const isPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isWEBP = header[0] === 0x52 && header[1] === 0x49; // RIFF

  if (!isJPEG && !isPNG && !isWEBP) {
    return { valid: false, error: 'File content does not match a valid image format.' };
  }

  return { valid: true };
}

// ─── Upload ──────────────────────────────────────

/**
 * Upload an image file.
 * @param {Object} file - Multer file object (buffer, mimetype, size)
 * @param {string} bucket - Storage bucket/folder (e.g. 'profiles', 'activities')
 * @param {string} entityId - Entity identifier (userId or activityId)
 * @returns {{ url: string, path: string }} or throws error
 */
function upload(file, bucket, entityId) {
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = MIME_TO_EXT[file.mimetype];
  const filename = `${uuidv4()}${ext}`;
  const storagePath = `${bucket}/${entityId}/${filename}`;
  const fullDir = path.join(UPLOAD_DIR, bucket, entityId);
  const fullPath = path.join(fullDir, filename);

  // Ensure directory exists
  fs.mkdirSync(fullDir, { recursive: true });

  // Write file
  fs.writeFileSync(fullPath, file.buffer);

  // Return URL path (served by express.static)
  const url = `/uploads/${storagePath}`;

  return { url, path: storagePath };
}

// ─── Delete ──────────────────────────────────────

/**
 * Delete an image by its storage path.
 * @param {string} storagePath - e.g. 'profiles/u-001/abc.jpg'
 */
function deleteImage(storagePath) {
  if (!storagePath) return { success: true };

  const fullPath = path.join(UPLOAD_DIR, storagePath);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to delete image:', err);
    return { success: false, error: err.message };
  }
}

// ─── Get URL ─────────────────────────────────────

/**
 * Get the public URL for a storage path.
 * @param {string} storagePath
 * @returns {string|null}
 */
function getUrl(storagePath) {
  if (!storagePath) return null;
  return `/uploads/${storagePath}`;
}

/**
 * Extract storage path from a URL.
 * @param {string} url - e.g. '/uploads/profiles/u-001/abc.jpg'
 * @returns {string|null}
 */
function pathFromUrl(url) {
  if (!url || !url.startsWith('/uploads/')) return null;
  return url.replace('/uploads/', '');
}

module.exports = {
  upload,
  delete: deleteImage,
  getUrl,
  pathFromUrl,
  validateImage,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};

/**
 * Upload Middleware — Multer Configuration
 * =========================================
 * Configures multer for memory storage with file validation.
 *
 * Uses memory storage so we can validate the buffer before writing
 * to disk via the imageService.
 */

const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Please upload a valid JPG, PNG, or WEBP image.'));
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Single image upload middleware.
 * Expects the file field name to be 'image'.
 */
const singleImage = uploadMiddleware.single('image');

/**
 * Wrapper that converts multer errors to JSON responses.
 */
function handleUpload(req, res, next) {
  singleImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: err.field || 'Please upload a valid JPG, PNG, or WEBP image.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(500).json({ error: 'Upload failed' });
    }
    next();
  });
}

module.exports = { handleUpload };

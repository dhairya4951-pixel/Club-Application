/**
 * Image Service — Storage Abstraction
 * ====================================
 * Centralizes all image upload/delete/URL operations.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabase, SUPABASE_READY } = require('../config/supabase');

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

async function upload(file, bucket, entityId) {
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = MIME_TO_EXT[file.mimetype];
  const filename = `${uuidv4()}${ext}`;
  const storagePath = `${entityId}/${filename}`;

  if (SUPABASE_READY) {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return { url: publicUrlData.publicUrl, path: storagePath };
  }

  // Mock Fallback
  const fullDir = path.join(UPLOAD_DIR, bucket, entityId);
  const fullPath = path.join(fullDir, filename);
  fs.mkdirSync(fullDir, { recursive: true });
  fs.writeFileSync(fullPath, file.buffer);
  
  // Note the prefix for local is /uploads/bucket/...
  const url = `/uploads/${bucket}/${storagePath}`;
  return { url, path: `${bucket}/${storagePath}` };
}

// ─── Delete ──────────────────────────────────────

async function deleteImage(bucket, storagePath) {
  if (!storagePath) return { success: true };

  if (SUPABASE_READY) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      console.error('Failed to delete image from Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Mock Fallback
  // Ensure we don't duplicate the bucket in the path if it already has it
  const cleanPath = storagePath.startsWith(`${bucket}/`) ? storagePath : `${bucket}/${storagePath}`;
  const fullPath = path.join(UPLOAD_DIR, cleanPath);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to delete image locally:', err);
    return { success: false, error: err.message };
  }
}

// ─── Get URL ─────────────────────────────────────

function getUrl(bucket, storagePath) {
  if (!storagePath) return null;

  if (SUPABASE_READY) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  const cleanPath = storagePath.startsWith(`${bucket}/`) ? storagePath : `${bucket}/${storagePath}`;
  return `/uploads/${cleanPath}`;
}

function pathFromUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) {
    // Local path format: /uploads/bucket/userId/filename
    return url.replace('/uploads/', '');
  }
  
  // Supabase URL format: https://.../storage/v1/object/public/bucketName/userId/filename
  if (url.includes('/storage/v1/object/public/')) {
    const parts = url.split('/storage/v1/object/public/');
    if (parts.length === 2) {
      // Return just the userId/filename part for Supabase
      const fullPath = parts[1]; // e.g. "profiles/userId/filename"
      const pathParts = fullPath.split('/');
      return pathParts.slice(1).join('/'); // returns "userId/filename"
    }
  }
  return null;
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

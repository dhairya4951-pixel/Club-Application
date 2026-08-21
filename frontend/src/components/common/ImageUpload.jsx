import { useState, useRef } from 'react';
import { imageService } from '../../services/imageService';
import './ImageUpload.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Reusable image upload component.
 *
 * @param {string}   currentImage   - Current image URL (or null)
 * @param {function} onImageChange  - Callback: (newUrl | null) => void
 * @param {'profile'|'activity'} uploadType - Determines which API endpoint to use
 * @param {string}   [activityId]   - Required for activity uploads (edit mode)
 * @param {boolean}  [showUrlOption] - Show "Use Image URL" toggle (default: false)
 * @param {'circle'|'rectangle'} [shape] - Avatar shape (default: 'rectangle')
 * @param {string}   [placeholder]  - Placeholder text/initials when no image
 */
export default function ImageUpload({
  currentImage,
  onImageChange,
  uploadType = 'profile',
  activityId,
  showUrlOption = false,
  shape = 'rectangle',
  placeholder = '📷',
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    // Client-side validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload to server
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError('');
    try {
      let result;
      if (uploadType === 'profile') {
        result = await imageService.uploadProfileImage(file);
      } else {
        result = await imageService.uploadActivityImage(file, activityId);
      }

      setPreviewUrl(null); // Clear local preview, use server URL
      onImageChange(result.url);
      setSuccess('✓ Image uploaded');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setError('');
    setSuccess('');
    setPreviewUrl(null);
    setUrlInput('');

    if (uploadType === 'profile' && currentImage) {
      try {
        setUploading(true);
        await imageService.removeProfileImage();
      } catch (err) {
        // Continue even if delete fails — clear the image on client side
        console.error('Failed to remove image:', err);
      } finally {
        setUploading(false);
      }
    }

    onImageChange(null);
  };

  const handleUrlSubmit = () => {
    setError('');
    if (!urlInput.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    onImageChange(urlInput.trim());
    setSuccess('✓ Image URL set');
    setTimeout(() => setSuccess(''), 3000);
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className={`image-upload image-upload--${shape}`}>
      {/* Preview Area */}
      <div className={`image-upload__preview image-upload__preview--${shape}`}>
        {displayImage ? (
          <img src={displayImage} alt="Preview" className="image-upload__img" />
        ) : (
          <span className="image-upload__placeholder">{placeholder}</span>
        )}
        {uploading && (
          <div className="image-upload__loading">
            <div className="image-upload__spinner" />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="image-upload__controls">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.webp"
          style={{ display: 'none' }}
        />

        {!useUrl && (
          <button
            type="button"
            className="image-upload__btn image-upload__btn--primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {currentImage ? '📷 Change Photo' : '📷 Upload from Device'}
          </button>
        )}

        {showUrlOption && (
          <>
            {!useUrl ? (
              <button
                type="button"
                className="image-upload__btn image-upload__btn--secondary"
                onClick={() => { setUseUrl(true); setError(''); }}
              >
                🔗 Use Image URL
              </button>
            ) : (
              <div className="image-upload__url-input">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="form-input"
                />
                <div className="image-upload__url-actions">
                  <button
                    type="button"
                    className="image-upload__btn image-upload__btn--primary"
                    onClick={handleUrlSubmit}
                  >
                    Set URL
                  </button>
                  <button
                    type="button"
                    className="image-upload__btn image-upload__btn--secondary"
                    onClick={() => { setUseUrl(false); setUrlInput(''); setError(''); }}
                  >
                    Upload Instead
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {displayImage && (
          <button
            type="button"
            className="image-upload__btn image-upload__btn--danger"
            onClick={handleRemove}
            disabled={uploading}
          >
            ✕ Remove
          </button>
        )}

        {/* Feedback */}
        {error && <p className="image-upload__error">⚠️ {error}</p>}
        {success && <p className="image-upload__success">{success}</p>}
      </div>
    </div>
  );
}

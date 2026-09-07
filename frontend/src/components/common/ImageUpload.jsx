import { useState, useRef } from 'react';
import { imageService } from '../../services/imageService';
import Icon from './Icon';
import './ImageUpload.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ImageUpload({
  currentImage,
  onImageChange,
  uploadType = 'profile',
  activityId,
  showUrlOption = false,
  shape = 'rectangle',
  placeholder = 'photo',
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

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

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

      setPreviewUrl(null);
      onImageChange(result.url);
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
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
    setSuccess('Image URL set');
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
          <span className="image-upload__placeholder">
            {typeof placeholder === 'string' && placeholder.length <= 3 ? (
              <span className="image-upload__initials">{placeholder}</span>
            ) : (
              <Icon name="camera" size={32} />
            )}
          </span>
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
            className="btn btn--secondary btn--sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="camera" size={14} />
            <span>{currentImage ? 'Change Photo' : 'Upload from Device'}</span>
          </button>
        )}

        {showUrlOption && (
          <>
            {!useUrl ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => { setUseUrl(true); setError(''); }}
              >
                <Icon name="link" size={14} />
                <span>Use Image URL</span>
              </button>
            ) : (
              <div className="image-upload__url-input">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                />
                <div className="image-upload__url-actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={handleUrlSubmit}
                  >
                    Set URL
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => { setUseUrl(false); setUrlInput(''); setError(''); }}
                  >
                    Upload File Instead
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {displayImage && (
          <button
            type="button"
            className="btn btn--ghost btn--sm text-danger"
            onClick={handleRemove}
            disabled={uploading}
          >
            <Icon name="trash" size={14} />
            <span>Remove</span>
          </button>
        )}

        {/* Feedback */}
        {error && (
          <p className="image-upload__error">
            <Icon name="alert" size={14} />
            <span>{error}</span>
          </p>
        )}
        {success && (
          <p className="image-upload__success">
            <Icon name="check" size={14} />
            <span>{success}</span>
          </p>
        )}
      </div>
    </div>
  );
}

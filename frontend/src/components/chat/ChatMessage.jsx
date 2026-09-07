import { useState, useRef, useEffect } from 'react';
import { getInitials, formatTime } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../common/Icon';
import './ChatMessage.css';

export default function ChatMessage({ message, onEdit, onDelete }) {
  const { user, isAdmin } = useAuth();
  const isOwn = user?.id === message.senderId;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [showActions, setShowActions] = useState(false);
  const editInputRef = useRef(null);
  const actionsRef = useRef(null);

  const canEdit = isOwn;
  const canDelete = isOwn || isAdmin;
  const hasActions = canEdit || canDelete;

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editing, editText.length]);

  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.message) {
      setEditing(false);
      setEditText(message.message);
      return;
    }
    onEdit?.(message.id, trimmed);
    setEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setEditText(message.message);
    }
  };

  const handleStartEdit = () => {
    setEditText(message.message);
    setEditing(true);
    setShowActions(false);
  };

  const handleDelete = () => {
    setShowActions(false);
    onDelete?.(message.id);
  };

  return (
    <div className={`chat-message ${isOwn ? 'chat-message--own' : ''}`}>
      <div className="chat-message__avatar">
        {message.sender?.profileImage ? (
          <img src={message.sender.profileImage} alt="" />
        ) : (
          <span>{getInitials(message.sender?.name)}</span>
        )}
      </div>
      <div className="chat-message__content">
        <div className="chat-message__header">
          <span className="chat-message__sender">{message.sender?.name || 'Unknown'}</span>
          <span className="chat-message__time">{formatTime(message.createdAt)}</span>
          {message.updatedAt && (
            <span className="chat-message__edited" title={`Edited ${formatTime(message.updatedAt)}`}>
              (edited)
            </span>
          )}

          {hasActions && (
            <div className="chat-message__actions-wrapper" ref={actionsRef}>
              <button
                className="chat-message__actions-trigger"
                onClick={() => setShowActions(prev => !prev)}
                title="Message actions"
                aria-label="Message actions"
              >
                •••
              </button>
              {showActions && (
                <div className="chat-message__actions-menu">
                  {canEdit && (
                    <button
                      className="chat-message__action-item"
                      onClick={handleStartEdit}
                    >
                      <Icon name="edit" size={13} />
                      <span>Edit</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="chat-message__action-item chat-message__action-item--danger"
                      onClick={handleDelete}
                    >
                      <Icon name="trash" size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="chat-message__edit">
            <input
              ref={editInputRef}
              type="text"
              className="chat-message__edit-input form-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              maxLength={2000}
            />
            <div className="chat-message__edit-actions">
              <button
                className="chat-message__edit-btn chat-message__edit-btn--save btn btn--primary btn--sm"
                onClick={handleEditSubmit}
                disabled={!editText.trim()}
              >
                Save
              </button>
              <button
                className="chat-message__edit-btn chat-message__edit-btn--cancel btn btn--secondary btn--sm"
                onClick={() => {
                  setEditing(false);
                  setEditText(message.message);
                }}
              >
                Cancel
              </button>
            </div>
            <span className="chat-message__edit-hint">
              Press Enter to save · Escape to cancel
            </span>
          </div>
        ) : (
          <p className="chat-message__text">{message.message}</p>
        )}
      </div>
    </div>
  );
}

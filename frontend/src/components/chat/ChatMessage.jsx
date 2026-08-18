import { getInitials, formatTime } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import './ChatMessage.css';

export default function ChatMessage({ message, onDelete }) {
  const { user, isAdmin } = useAuth();
  const isOwn = user?.id === message.senderId;

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
          {isAdmin && onDelete && (
            <button
              className="chat-message__delete"
              onClick={() => onDelete(message.id)}
              title="Delete message"
            >
              ✕
            </button>
          )}
        </div>
        <p className="chat-message__text">{message.message}</p>
      </div>
    </div>
  );
}

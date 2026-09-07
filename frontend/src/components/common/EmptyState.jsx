import Icon from './Icon';
import './EmptyState.css';

export default function EmptyState({ icon = 'document', title, message, action }) {
  const isEmoji = typeof icon === 'string' && /\p{Extended_Pictographic}/u.test(icon);

  return (
    <div className="empty-state card-surface">
      <div className="empty-state__icon-wrap">
        {isEmoji ? (
          <span className="empty-state__emoji">{icon}</span>
        ) : (
          <Icon name={icon} size={32} />
        )}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

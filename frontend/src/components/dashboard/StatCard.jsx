import Icon from '../common/Icon';
import './StatCard.css';

const EMOJI_TO_ICON = {
  '👥': 'users',
  '📅': 'calendar',
  '✅': 'check-circle',
  '📋': 'document',
  '🏆': 'award',
  '💬': 'message',
  '❌': 'close',
  '📊': 'chart',
  '⭐': 'star',
  '🎯': 'award',
  '📚': 'book',
  '👤': 'user',
  '➕': 'plus',
  '📝': 'edit',
};

export default function StatCard({ icon, label, value, color = 'primary' }) {
  const iconName = EMOJI_TO_ICON[icon] || icon;
  const isEmoji = typeof icon === 'string' && !EMOJI_TO_ICON[icon] && /\p{Extended_Pictographic}/u.test(icon);

  return (
    <div className={`stat-card stat-card--${color} card-surface`}>
      <div className="stat-card__icon-wrapper">
        {isEmoji ? (
          <span className="stat-card__emoji">{icon}</span>
        ) : (
          <Icon name={iconName} size={20} />
        )}
      </div>
      <div className="stat-card__info">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
      </div>
    </div>
  );
}

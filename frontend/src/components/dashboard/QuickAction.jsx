import { useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import './QuickAction.css';

const EMOJI_TO_ICON = {
  '➕': 'plus',
  '📝': 'edit',
  '✅': 'check-circle',
  '⭐': 'star',
  '👥': 'users',
  '👤': 'user',
  '📊': 'chart',
  '🛡️': 'shield',
};

export default function QuickAction({ icon, label, to }) {
  const navigate = useNavigate();
  const iconName = EMOJI_TO_ICON[icon] || icon;
  const isEmoji = typeof icon === 'string' && !EMOJI_TO_ICON[icon] && /\p{Extended_Pictographic}/u.test(icon);

  return (
    <button className="quick-action card-surface" onClick={() => navigate(to)}>
      <div className="quick-action__icon-wrap">
        {isEmoji ? (
          <span className="quick-action__emoji">{icon}</span>
        ) : (
          <Icon name={iconName} size={18} />
        )}
      </div>
      <span className="quick-action__label">{label}</span>
      <span className="quick-action__arrow">
        <Icon name="chevron-right" size={16} />
      </span>
    </button>
  );
}

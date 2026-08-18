import { getPositionLabel } from '../../utils/helpers';
import './PositionBadge.css';

export default function PositionBadge({ position, role, size = 'sm' }) {
  // Determine badge variant — teacher gets its own badge
  const variant = role === 'teacher_admin' ? 'teacher_admin' : position;

  // Don't show a badge for normal members (position: 'none')
  if (variant === 'none') return null;

  return (
    <span className={`position-badge position-badge--${variant} position-badge--${size}`}>
      {getPositionLabel(position, role)}
    </span>
  );
}

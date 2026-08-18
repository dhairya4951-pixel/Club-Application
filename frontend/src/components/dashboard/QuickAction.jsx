import { useNavigate } from 'react-router-dom';
import './QuickAction.css';

export default function QuickAction({ icon, label, to }) {
  const navigate = useNavigate();

  return (
    <button className="quick-action" onClick={() => navigate(to)}>
      <span className="quick-action__icon">{icon}</span>
      <span className="quick-action__label">{label}</span>
    </button>
  );
}

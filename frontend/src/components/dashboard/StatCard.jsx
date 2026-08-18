import './StatCard.css';

export default function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <span className="stat-card__icon">{icon}</span>
      <div className="stat-card__info">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
      </div>
    </div>
  );
}

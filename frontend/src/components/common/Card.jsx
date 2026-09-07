import Icon from './Icon';
import './Card.css';

export default function Card({ children, className = '', hover = true, onClick }) {
  return (
    <div
      className={`card ${hover ? 'card--hover' : ''} ${onClick ? 'card--clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardImage({ src, alt, overlay }) {
  return (
    <div className="card-image">
      <div
        className="card-image__img"
        style={{ backgroundImage: src ? `url(${src})` : undefined }}
      >
        {!src && (
          <span className="card-image__placeholder">
            <Icon name="camera" size={28} />
          </span>
        )}
      </div>
      {overlay && <div className="card-image__overlay">{overlay}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

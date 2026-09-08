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
      {src ? (
        <img
          src={src}
          alt={alt || 'Card image'}
          loading="lazy"
          decoding="async"
          className="card-image__img"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      ) : (
        <div className="card-image__img">
          <span className="card-image__placeholder">
            <Icon name="camera" size={28} />
          </span>
        </div>
      )}
      {overlay && <div className="card-image__overlay">{overlay}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

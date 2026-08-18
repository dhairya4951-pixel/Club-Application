import { useNavigate } from 'react-router-dom';
import Card, { CardImage, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import { formatDate, truncateText, getStatusColor } from '../../utils/helpers';
import './ActivityCard.css';

export default function ActivityCard({ activity }) {
  const navigate = useNavigate();

  const statusLabels = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <Card
      className="activity-card animate-fade-in"
      onClick={() => navigate(`/activities/${activity.id}`)}
    >
      <CardImage
        src={activity.coverImage}
        alt={activity.title}
        overlay={
          <Badge variant={getStatusColor(activity.status)}>
            {statusLabels[activity.status]}
          </Badge>
        }
      />
      <CardBody>
        {activity.category && (
          <span className="activity-card__category">{activity.category}</span>
        )}
        <h3 className="activity-card__title">{activity.title}</h3>
        <p className="activity-card__desc">{truncateText(activity.description)}</p>
        <div className="activity-card__meta">
          <span className="activity-card__meta-item">📅 {formatDate(activity.date)}</span>
          <span className="activity-card__meta-item">🕐 {activity.time}</span>
        </div>
        <div className="activity-card__meta">
          <span className="activity-card__meta-item">📍 {activity.location}</span>
        </div>
      </CardBody>
    </Card>
  );
}

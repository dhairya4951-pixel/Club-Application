import { useNavigate } from 'react-router-dom';
import Card, { CardImage, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
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
          <Badge variant={getStatusColor(activity.status)} size="sm">
            {statusLabels[activity.status] || activity.status}
          </Badge>
        }
      />
      <CardBody>
        <div className="activity-card__top">
          {activity.category && (
            <span className="activity-card__category">{activity.category}</span>
          )}
        </div>
        <h3 className="activity-card__title">{activity.title}</h3>
        <p className="activity-card__desc">{truncateText(activity.description, 95)}</p>
        
        <div className="activity-card__footer">
          <div className="activity-card__meta">
            <span className="activity-card__meta-item">
              <Icon name="calendar" size={14} />
              {formatDate(activity.date)}
            </span>
            {activity.time && (
              <span className="activity-card__meta-item">
                <Icon name="clock" size={14} />
                {activity.time}
              </span>
            )}
          </div>
          {activity.location && (
            <div className="activity-card__location">
              <Icon name="map-pin" size={14} />
              <span>{activity.location}</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

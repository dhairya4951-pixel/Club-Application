import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import { memberService } from '../../services/memberService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Icon from '../../components/common/Icon';
import { formatDate, getStatusColor } from '../../utils/helpers';
import './ActivityDetailPage.css';

export default function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [createdByName, setCreatedByName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchActivity() {
      try {
        const data = await activityService.getById(id);
        setActivity(data);
        try {
          const members = await memberService.getAll();
          const creator = members.find(m => m.id === data.createdBy);
          if (creator) setCreatedByName(creator.name);
        } catch {}
      } catch (err) {
        setError(err.message || 'Activity not found');
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [id]);

  if (loading) return <Loading fullPage message="Loading activity details..." />;
  if (error || !activity) {
    return (
      <div className="container">
        <div className="detail-error card-surface">
          <Icon name="alert" size={32} />
          <h2>Activity Not Found</h2>
          <p>{error || "The activity you're looking for doesn't exist."}</p>
          <Button variant="primary" onClick={() => navigate('/activities')}>Back to Activities</Button>
        </div>
      </div>
    );
  }

  const statusLabels = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };

  return (
    <div className="container activity-detail-page">
      <button className="back-link" onClick={() => navigate('/activities')}>
        <Icon name="arrow-left" size={15} />
        <span>Back to Activities</span>
      </button>

      <article className="activity-article animate-fade-in card-surface">
        {/* Cover Image Frame */}
        <div className="activity-article__cover">
          {activity.coverImage ? (
            <img src={activity.coverImage} alt={activity.title} className="activity-article__cover-img" />
          ) : (
            <div className="activity-article__placeholder">
              <Icon name="camera" size={48} />
            </div>
          )}
        </div>

        <div className="activity-article__content">
          {/* Category & Status */}
          <div className="activity-article__badges">
            {activity.category && (
              <Badge variant="primary" size="md">
                {activity.category}
              </Badge>
            )}
            <Badge variant={getStatusColor(activity.status)} size="md">
              {statusLabels[activity.status] || activity.status}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="activity-article__title">{activity.title}</h1>

          {/* Metadata Row */}
          <div className="activity-article__meta-bar">
            <div className="activity-article__meta-item">
              <Icon name="calendar" size={16} />
              <div>
                <span className="activity-article__meta-label">Date</span>
                <span className="activity-article__meta-val">{formatDate(activity.date)}</span>
              </div>
            </div>

            {activity.time && (
              <div className="activity-article__meta-item">
                <Icon name="clock" size={16} />
                <div>
                  <span className="activity-article__meta-label">Time</span>
                  <span className="activity-article__meta-val">{activity.time}</span>
                </div>
              </div>
            )}

            {activity.location && (
              <div className="activity-article__meta-item">
                <Icon name="map-pin" size={16} />
                <div>
                  <span className="activity-article__meta-label">Location</span>
                  <span className="activity-article__meta-val">{activity.location}</span>
                </div>
              </div>
            )}

            {createdByName && (
              <div className="activity-article__meta-item">
                <Icon name="user" size={16} />
                <div>
                  <span className="activity-article__meta-label">Organized By</span>
                  <span className="activity-article__meta-val">{createdByName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="activity-article__body">
            <h2 className="activity-article__heading">About this Event</h2>
            <div className="activity-article__text">
              {activity.description}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

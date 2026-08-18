import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import { memberService } from '../../services/memberService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
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
        // Fetch creator name
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

  if (loading) return <Loading fullPage message="Loading activity..." />;
  if (error || !activity) {
    return (
      <div className="container">
        <div className="detail-error">
          <h2>Activity Not Found</h2>
          <p>{error || 'The activity you\'re looking for doesn\'t exist.'}</p>
          <Button onClick={() => navigate('/activities')}>Back to Activities</Button>
        </div>
      </div>
    );
  }

  const statusLabels = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };

  return (
    <div className="container">
      <button className="back-link" onClick={() => navigate('/activities')}>
        ← Back to Activities
      </button>

      <div className="detail animate-fade-in">
        <div className="detail__image">
          {activity.coverImage ? (
            <img src={activity.coverImage} alt={activity.title} />
          ) : (
            <div className="detail__image-placeholder">📷</div>
          )}
        </div>

        <div className="detail__content">
          <div className="detail__header">
            <Badge variant={getStatusColor(activity.status)} size="md">
              {statusLabels[activity.status]}
            </Badge>
            {activity.category && (
              <Badge variant="primary" size="md">{activity.category}</Badge>
            )}
          </div>

          <h1 className="detail__title">{activity.title}</h1>

          <div className="detail__meta-grid">
            <div className="detail__meta-item">
              <span className="detail__meta-icon">📅</span>
              <div>
                <span className="detail__meta-label">Date</span>
                <span className="detail__meta-value">{formatDate(activity.date)}</span>
              </div>
            </div>
            <div className="detail__meta-item">
              <span className="detail__meta-icon">🕐</span>
              <div>
                <span className="detail__meta-label">Time</span>
                <span className="detail__meta-value">{activity.time}</span>
              </div>
            </div>
            <div className="detail__meta-item">
              <span className="detail__meta-icon">📍</span>
              <div>
                <span className="detail__meta-label">Location</span>
                <span className="detail__meta-value">{activity.location}</span>
              </div>
            </div>
            {createdByName && (
              <div className="detail__meta-item">
                <span className="detail__meta-icon">👤</span>
                <div>
                  <span className="detail__meta-label">Created By</span>
                  <span className="detail__meta-value">{createdByName}</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail__description">
            <h3>Description</h3>
            <p>{activity.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

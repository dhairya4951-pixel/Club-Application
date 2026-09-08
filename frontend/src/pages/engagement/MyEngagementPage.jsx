import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { engagementService } from '../../services/engagementService';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import { formatDate } from '../../utils/helpers';
import './MyEngagementPage.css';

function getLevelBadgeVariant(level) {
  switch (level) {
    case 'Excellent': case 'High': case 'Highly Engaged': return 'success';
    case 'Good': case 'Moderate': case 'Active': return 'info';
    case 'Emerging': case 'Moderately Active': return 'warning';
    default: return 'default';
  }
}

export default function MyEngagementPage() {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [engRes, tlRes] = await Promise.allSettled([
        engagementService.getMyEngagement(),
        engagementService.getTimeline(user.id),
      ]);

      if (engRes.status === 'fulfilled') {
        setEngagement(engRes.value);
      } else {
        console.error('Failed to load engagement:', engRes.reason);
      }

      if (tlRes.status === 'fulfilled') {
        setTimeline(tlRes.value);
      } else {
        console.error('Failed to load timeline:', tlRes.reason);
      }

      if (engRes.status === 'rejected') {
        setError(engRes.reason?.message || 'Unable to load engagement records. Please check your connection.');
      }
    } catch (err) {
      console.error('Failed to load engagement data:', err);
      setError(err.message || 'Unable to load engagement data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  if (loading) return <Loading fullPage message="Loading engagement analysis..." />;
  if (error && !engagement) {
    return (
      <div className="container engagement-page">
        <EmptyState icon="alert" title="Engagement Data Unavailable" message={error} />
      </div>
    );
  }
  if (!engagement) return <EmptyState icon="chart" title="No engagement data" message="No engagement metrics recorded yet." />;

  const { attendance, discussion, contribution, activityLevel, contributionLevel, overallLabel } = engagement;

  return (
    <div className="container engagement-page">
      <div className="page-header engagement-header">
        <div>
          <span className="eyebrow-label">Participation & Impact</span>
          <h1>My Engagement</h1>
          <p>A comprehensive analysis of your activity presence, discussion participation, and club contributions.</p>
        </div>
        <div className="engagement-overall-wrap">
          <span className="engagement-overall-label">Overall Standing</span>
          <Badge variant={getLevelBadgeVariant(overallLabel)} size="lg">
            {overallLabel}
          </Badge>
        </div>
      </div>

      {/* ─── Two Dimension Grid: Activity & Contribution ── */}
      <div className="engagement-dimensions-grid">
        {/* Dimension 1: Activity */}
        <div className="engagement-card card-surface animate-fade-in">
          <div className="engagement-card__header">
            <div className="engagement-card__title-wrap">
              <Icon name="chart" size={18} />
              <h2 className="engagement-card__title">Activity Dimension</h2>
            </div>
            <Badge variant={getLevelBadgeVariant(activityLevel)} size="sm">
              Level: {activityLevel}
            </Badge>
          </div>

          <div className="engagement-card__body">
            <div className="engagement-hero-stat">
              <div className="engagement-hero-circle">
                <span className="engagement-hero-circle__val">{attendance.percentage}%</span>
                <span className="engagement-hero-circle__label">Attendance</span>
              </div>
              <div className="engagement-hero-stat__desc">
                <span className="engagement-hero-stat__highlight">
                  {attendance.attended} sessions attended
                </span>
                <span className="engagement-hero-stat__sub">
                  out of {attendance.total} total club meetings
                </span>
              </div>
            </div>

            <div className="engagement-metrics-list">
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="check-circle" size={14} />
                  Attended
                </span>
                <span className="engagement-metric-val">{attendance.attended}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="x" size={14} />
                  Missed
                </span>
                <span className="engagement-metric-val">{attendance.missed}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="message" size={14} />
                  Discussion Messages
                </span>
                <span className="engagement-metric-val">{discussion.meaningfulMessages}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="calendar" size={14} />
                  Active Forum Days
                </span>
                <span className="engagement-metric-val">{discussion.activeDays}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension 2: Contribution */}
        <div className="engagement-card card-surface animate-fade-in">
          <div className="engagement-card__header">
            <div className="engagement-card__title-wrap">
              <Icon name="award" size={18} />
              <h2 className="engagement-card__title">Contribution Dimension</h2>
            </div>
            <Badge variant={getLevelBadgeVariant(contributionLevel)} size="sm">
              Level: {contributionLevel}
            </Badge>
          </div>

          <div className="engagement-card__body">
            <div className="engagement-hero-stat">
              <div className="engagement-hero-circle engagement-hero-circle--points">
                <span className="engagement-hero-circle__val">{contribution.totalPoints}</span>
                <span className="engagement-hero-circle__label">Total Points</span>
              </div>
              <div className="engagement-hero-stat__desc">
                <span className="engagement-hero-stat__highlight">
                  Earned Contributions
                </span>
                <span className="engagement-hero-stat__sub">
                  Peer and faculty verified work
                </span>
              </div>
            </div>

            <div className="engagement-metrics-list">
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="document" size={14} />
                  Discrete Tasks
                </span>
                <span className="engagement-metric-val">{contribution.taskCount}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="book" size={14} />
                  Academic Resources
                </span>
                <span className="engagement-metric-val">{contribution.resourceCount}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="users" size={14} />
                  Events Organized / Supported
                </span>
                <span className="engagement-metric-val">{contribution.eventOrganizedCount + contribution.eventSupportCount}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label">
                  <Icon name="star" size={14} />
                  Major Responsibilities
                </span>
                <span className="engagement-metric-val">{contribution.majorCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Timeline Feed ─────────────────────────────────── */}
      <section className="engagement-timeline-section">
        <div className="engagement-timeline-header">
          <h2 className="section-title">Activity & Contribution Timeline</h2>
          <span className="engagement-count-badge">{timeline.length} Events</span>
        </div>

        {timeline.length === 0 ? (
          <EmptyState icon="calendar" title="No timeline records" message="Your session attendance and recorded contributions will form your timeline." />
        ) : (
          <div className="engagement-timeline-list card-surface">
            {timeline.map((item, i) => (
              <div key={i} className={`timeline-row timeline-row--${item.type}`}>
                <div className="timeline-row__icon-wrap">
                  <Icon
                    name={
                      item.type === 'contribution'
                        ? 'award'
                        : item.status === 'present'
                        ? 'check'
                        : 'x'
                    }
                    size={14}
                  />
                </div>

                <div className="timeline-row__info">
                  <span className="timeline-row__title">{item.title}</span>
                  <span className="timeline-row__date">
                    <Icon name="calendar" size={12} />
                    {formatDate(item.date)}
                  </span>
                </div>

                <div className="timeline-row__badge">
                  {item.type === 'contribution' ? (
                    <span className="timeline-points-tag">+{item.points} pts</span>
                  ) : (
                    <Badge variant={item.status === 'present' ? 'success' : 'error'} size="sm">
                      {item.status === 'present' ? 'Present' : 'Absent'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

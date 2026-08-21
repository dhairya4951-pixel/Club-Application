import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { engagementService } from '../../services/engagementService';
import StatCard from '../../components/dashboard/StatCard';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';
import './MyEngagementPage.css';

function getLevelColor(level) {
  switch (level) {
    case 'Excellent': case 'High': case 'Highly Engaged': return 'success';
    case 'Good': case 'Moderate': case 'Active': return 'info';
    case 'Moderate': case 'Emerging': case 'Moderately Active': return 'warning';
    default: return 'muted';
  }
}

export default function MyEngagementPage() {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [engData, tlData] = await Promise.all([
          engagementService.getMyEngagement(),
          engagementService.getTimeline(user.id),
        ]);
        setEngagement(engData);
        setTimeline(tlData);
      } catch (err) {
        console.error('Failed to load engagement:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchData();
  }, [user?.id]);

  if (loading) return <Loading fullPage message="Loading engagement data..." />;
  if (!engagement) return <EmptyState icon="📊" title="No data" message="Unable to load engagement data." />;

  const { attendance, discussion, contribution, activityLevel, contributionLevel, overallLabel } = engagement;

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Engagement</h1>
        <p>Track your activity participation and contributions</p>
      </div>

      {/* Overall Label */}
      <div className="engagement-overall animate-fade-in">
        <Badge variant={getLevelColor(overallLabel)} size="lg">{overallLabel}</Badge>
      </div>

      {/* Activity Dimension */}
      <section className="engagement-section animate-fade-in">
        <h2 className="section-title">📊 Club Activity</h2>
        <div className="grid-4 engagement-stats">
          <StatCard icon="📋" label="Attendance" value={`${attendance.percentage}%`} color="primary" />
          <StatCard icon="✅" label="Attended" value={attendance.attended} color="accent" />
          <StatCard icon="❌" label="Missed" value={attendance.missed} color="warning" />
          <StatCard icon="💬" label="Messages" value={discussion.meaningfulMessages} color="info" />
        </div>
        <div className="engagement-detail-row">
          <span className="engagement-detail-label">Attendance</span>
          <div className="engagement-bar-wrapper">
            <div className="engagement-bar" style={{ width: `${Math.min(attendance.percentage, 100)}%` }} />
          </div>
          <span className="engagement-detail-value">{attendance.attended} / {attendance.total}</span>
          <Badge variant={getLevelColor(activityLevel)} size="sm">{activityLevel}</Badge>
        </div>
        <div className="engagement-detail-row">
          <span className="engagement-detail-label">Discussion</span>
          <span className="engagement-detail-value">{discussion.meaningfulMessages} meaningful messages · {discussion.activeDays} active days</span>
        </div>
      </section>

      {/* Contribution Dimension */}
      <section className="engagement-section animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="section-title">⭐ Club Contribution</h2>
        <div className="grid-4 engagement-stats">
          <StatCard icon="🏆" label="Total Points" value={contribution.totalPoints} color="primary" />
          <StatCard icon="📋" label="Tasks" value={contribution.taskCount} color="accent" />
          <StatCard icon="📚" label="Resources" value={contribution.resourceCount} color="info" />
          <StatCard icon="🎯" label="Events" value={contribution.eventOrganizedCount + contribution.eventSupportCount} color="warning" />
        </div>
        {contribution.majorCount > 0 && (
          <div className="engagement-detail-row">
            <span className="engagement-detail-label">Major Responsibilities</span>
            <span className="engagement-detail-value">{contribution.majorCount}</span>
          </div>
        )}
        <div className="engagement-detail-row">
          <span className="engagement-detail-label">Contribution Level</span>
          <Badge variant={getLevelColor(contributionLevel)} size="sm">{contributionLevel}</Badge>
        </div>
      </section>

      {/* Timeline */}
      <section className="engagement-section animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h2 className="section-title">📅 Activity & Contribution Timeline</h2>
        {timeline.length === 0 ? (
          <EmptyState icon="📅" title="No activity yet" message="Your engagement timeline will appear here." />
        ) : (
          <div className="engagement-timeline">
            {timeline.map((item, i) => (
              <div
                key={i}
                className={`timeline-item timeline-item--${item.type} ${item.status === 'absent' ? 'timeline-item--absent' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="timeline-item__icon">
                  {item.type === 'contribution' ? item.icon : (item.status === 'present' ? '✓' : '✗')}
                </div>
                <div className="timeline-item__content">
                  <span className="timeline-item__title">{item.title}</span>
                  <span className="timeline-item__date">{formatDate(item.date)}</span>
                </div>
                <div className="timeline-item__badge">
                  {item.type === 'contribution' ? (
                    <span className="timeline-points">+{item.points}</span>
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

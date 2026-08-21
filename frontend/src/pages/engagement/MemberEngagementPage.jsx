import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { engagementService } from '../../services/engagementService';
import { contributionService } from '../../services/contributionService';
import StatCard from '../../components/dashboard/StatCard';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, getPositionLabel, getInitials } from '../../utils/helpers';
import '../engagement/MyEngagementPage.css';

function getLevelColor(level) {
  switch (level) {
    case 'Excellent': case 'High': case 'Highly Engaged': return 'success';
    case 'Good': case 'Moderate': case 'Active': return 'info';
    case 'Emerging': case 'Moderately Active': return 'warning';
    default: return 'muted';
  }
}

export default function MemberEngagementPage() {
  const { memberId } = useParams();
  const [engagement, setEngagement] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [engData, contribData, tlData] = await Promise.all([
          engagementService.getMemberEngagement(memberId),
          contributionService.getByMember(memberId),
          engagementService.getTimeline(memberId),
        ]);
        setEngagement(engData);
        setContributions(contribData);
        setTimeline(tlData);
      } catch (err) {
        console.error('Failed to load member engagement:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [memberId]);

  if (loading) return <Loading fullPage message="Loading member engagement..." />;
  if (!engagement) return <EmptyState icon="📊" title="No data" message="Unable to load engagement data." />;

  const { attendance, discussion, contribution, activityLevel, contributionLevel, overallLabel } = engagement;

  // Get member name from contributions if available
  const memberName = contributions[0]?.member?.name || 'Member';
  const memberPosition = contributions[0]?.member?.position;
  const memberRole = contributions[0]?.member?.role;

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div className="navbar__avatar" style={{ width: 48, height: 48, fontSize: 'var(--font-size-lg)' }}>
            {getInitials(memberName)}
          </div>
          <div>
            <h1>{memberName}</h1>
            <p>{getPositionLabel(memberPosition, memberRole)}</p>
          </div>
        </div>
        <Badge variant={getLevelColor(overallLabel)} size="lg">{overallLabel}</Badge>
      </div>

      {/* Activity */}
      <section className="engagement-section animate-fade-in">
        <h2 className="section-title">📊 Club Activity</h2>
        <div className="grid-4 engagement-stats">
          <StatCard icon="📋" label="Attendance" value={`${attendance.percentage}%`} color="primary" />
          <StatCard icon="✅" label="Attended" value={attendance.attended} color="accent" />
          <StatCard icon="❌" label="Missed" value={attendance.missed} color="warning" />
          <StatCard icon="💬" label="Messages" value={discussion.meaningfulMessages} color="info" />
        </div>
        <div className="engagement-detail-row">
          <span className="engagement-detail-label">Activity Level</span>
          <Badge variant={getLevelColor(activityLevel)} size="sm">{activityLevel}</Badge>
        </div>
      </section>

      {/* Contribution */}
      <section className="engagement-section animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="section-title">⭐ Club Contribution</h2>
        <div className="grid-4 engagement-stats">
          <StatCard icon="🏆" label="Total Points" value={contribution.totalPoints} color="primary" />
          <StatCard icon="📋" label="Tasks" value={contribution.taskCount} color="accent" />
          <StatCard icon="📚" label="Resources" value={contribution.resourceCount} color="info" />
          <StatCard icon="🎯" label="Events" value={contribution.eventOrganizedCount + contribution.eventSupportCount} color="warning" />
        </div>
        <div className="engagement-detail-row">
          <span className="engagement-detail-label">Contribution Level</span>
          <Badge variant={getLevelColor(contributionLevel)} size="sm">{contributionLevel}</Badge>
        </div>
      </section>

      {/* Contribution History */}
      {contributions.length > 0 && (
        <section className="engagement-section animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="section-title">📝 Contribution History</h2>
          <div className="engagement-timeline">
            {contributions.map((c, i) => (
              <div key={c.id} className="timeline-item timeline-item--contribution" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="timeline-item__icon">{c.categoryIcon}</div>
                <div className="timeline-item__content">
                  <span className="timeline-item__title">{c.title}</span>
                  <span className="timeline-item__date">
                    {formatDate(c.date)} · Recorded by {c.recorder?.name || 'Admin'}
                  </span>
                </div>
                <span className="timeline-points">+{c.points}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="engagement-section animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="section-title">📅 Timeline</h2>
        {timeline.length === 0 ? (
          <EmptyState icon="📅" title="No activity yet" message="No engagement data available." />
        ) : (
          <div className="engagement-timeline">
            {timeline.slice(0, 20).map((item, i) => (
              <div
                key={i}
                className={`timeline-item timeline-item--${item.type} ${item.status === 'absent' ? 'timeline-item--absent' : ''}`}
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

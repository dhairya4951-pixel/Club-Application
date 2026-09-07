import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { engagementService } from '../../services/engagementService';
import { contributionService } from '../../services/contributionService';
import { memberService } from '../../services/memberService';
import Badge from '../../components/common/Badge';
import PositionBadge from '../../components/member/PositionBadge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import { formatDate, getInitials } from '../../utils/helpers';
import '../engagement/MyEngagementPage.css';

function getLevelBadgeVariant(level) {
  switch (level) {
    case 'Excellent': case 'High': case 'Highly Engaged': return 'success';
    case 'Good': case 'Moderate': case 'Active': return 'info';
    case 'Emerging': case 'Moderately Active': return 'warning';
    default: return 'default';
  }
}

export default function MemberEngagementPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [engData, contribData, tlData, memberData] = await Promise.all([
          engagementService.getMemberEngagement(memberId),
          contributionService.getByMember(memberId),
          engagementService.getTimeline(memberId),
          memberService.getById(memberId).catch(() => null),
        ]);
        setEngagement(engData);
        setContributions(contribData);
        setTimeline(tlData);
        setMember(memberData);
      } catch (err) {
        console.error('Failed to load member engagement:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [memberId]);

  if (loading) return <Loading fullPage message="Loading member engagement portfolio..." />;
  if (!engagement) return <EmptyState icon="chart" title="No engagement data" message="Unable to load engagement records for this member." />;

  const { attendance, discussion, contribution, activityLevel, contributionLevel, overallLabel } = engagement;
  const memberName = member?.name || contributions[0]?.member?.name || 'Member';
  const memberPosition = member?.position || contributions[0]?.member?.position;
  const memberRole = member?.role || contributions[0]?.member?.role;

  return (
    <div className="container engagement-page">
      <button className="back-link" onClick={() => navigate('/members')}>
        <Icon name="arrow-left" size={15} />
        <span>Back to Directory</span>
      </button>

      {/* Member Identity Header Card */}
      <div className="profile-card card-surface animate-fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="profile-card__header">
          <div className="navbar__avatar" style={{ width: 64, height: 64, fontSize: '1.25rem' }}>
            {getInitials(memberName)}
          </div>
          <div className="profile-card__identity">
            <div className="profile-card__badge-wrap">
              <PositionBadge position={memberPosition} role={memberRole} size="md" />
            </div>
            <h1 className="profile-card__name" style={{ fontSize: '1.75rem' }}>{memberName}</h1>
            <p className="profile-card__email">
              <Icon name="user" size={13} />
              <span>{member?.email || 'Active Club Member'}</span>
            </p>
          </div>
          <div className="engagement-overall-wrap">
            <span className="engagement-overall-label">Engagement Status</span>
            <Badge variant={getLevelBadgeVariant(overallLabel)} size="lg">
              {overallLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Two Dimension Grid */}
      <div className="engagement-dimensions-grid">
        {/* Activity */}
        <div className="engagement-card card-surface animate-fade-in">
          <div className="engagement-card__header">
            <div className="engagement-card__title-wrap">
              <Icon name="chart" size={18} />
              <h2 className="engagement-card__title">Activity Standing</h2>
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
                  {attendance.attended} / {attendance.total} Sessions
                </span>
                <span className="engagement-hero-stat__sub">
                  Participation rate across club events
                </span>
              </div>
            </div>

            <div className="engagement-metrics-list">
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="check-circle" size={14} /> Attended</span>
                <span className="engagement-metric-val">{attendance.attended}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="x" size={14} /> Missed</span>
                <span className="engagement-metric-val">{attendance.missed}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="message" size={14} /> Discussion Messages</span>
                <span className="engagement-metric-val">{discussion.meaningfulMessages}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="calendar" size={14} /> Active Forum Days</span>
                <span className="engagement-metric-val">{discussion.activeDays}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution */}
        <div className="engagement-card card-surface animate-fade-in">
          <div className="engagement-card__header">
            <div className="engagement-card__title-wrap">
              <Icon name="award" size={18} />
              <h2 className="engagement-card__title">Club Contributions</h2>
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
                  Verified Contribution Work
                </span>
                <span className="engagement-hero-stat__sub">
                  Recognized impact and tasks
                </span>
              </div>
            </div>

            <div className="engagement-metrics-list">
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="document" size={14} /> Tasks Completed</span>
                <span className="engagement-metric-val">{contribution.taskCount}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="book" size={14} /> Resources Created</span>
                <span className="engagement-metric-val">{contribution.resourceCount}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="users" size={14} /> Events Organized / Supported</span>
                <span className="engagement-metric-val">{contribution.eventOrganizedCount + contribution.eventSupportCount}</span>
              </div>
              <div className="engagement-metric-row">
                <span className="engagement-metric-label"><Icon name="star" size={14} /> Major Responsibilities</span>
                <span className="engagement-metric-val">{contribution.majorCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Records History */}
      {contributions.length > 0 && (
        <section className="engagement-timeline-section">
          <div className="engagement-timeline-header">
            <h2 className="section-title">Verified Contribution Records</h2>
            <span className="engagement-count-badge">{contributions.length} Contributions</span>
          </div>

          <div className="engagement-timeline-list card-surface">
            {contributions.map((c) => (
              <div key={c.id} className="timeline-row timeline-row--contribution">
                <div className="timeline-row__icon-wrap">
                  <Icon name="award" size={14} />
                </div>
                <div className="timeline-row__info">
                  <span className="timeline-row__title">{c.title}</span>
                  <span className="timeline-row__date">
                    <Icon name="calendar" size={12} />
                    {formatDate(c.date)} · Recorded by {c.recorder?.name || 'Administrator'}
                  </span>
                  {c.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {c.description}
                    </p>
                  )}
                </div>
                <span className="timeline-points-tag">+{c.points} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline Feed */}
      <section className="engagement-timeline-section">
        <div className="engagement-timeline-header">
          <h2 className="section-title">Combined Event Timeline</h2>
          <span className="engagement-count-badge">{timeline.length} Records</span>
        </div>

        {timeline.length === 0 ? (
          <EmptyState icon="calendar" title="No activity recorded" message="No timeline events exist for this member." />
        ) : (
          <div className="engagement-timeline-list card-surface">
            {timeline.slice(0, 20).map((item, i) => (
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

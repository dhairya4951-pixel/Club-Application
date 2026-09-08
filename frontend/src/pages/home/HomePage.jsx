import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { activityService } from '../../services/activityService';
import { memberService } from '../../services/memberService';
import ActivityCard from '../../components/activity/ActivityCard';
import StatCard from '../../components/dashboard/StatCard';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Icon from '../../components/common/Icon';
import { formatDate } from '../../utils/helpers';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [upcomingRes, pastRes, membersRes] = await Promise.allSettled([
        activityService.getUpcoming(),
        activityService.getPast(),
        memberService.getAll(),
      ]);

      if (upcomingRes.status === 'fulfilled') setUpcoming(upcomingRes.value);
      else console.error('Failed to load upcoming activities:', upcomingRes.reason);

      if (pastRes.status === 'fulfilled') setPast(pastRes.value);
      else console.error('Failed to load past activities:', pastRes.reason);

      if (membersRes.status === 'fulfilled') setMembers(membersRes.value);
      else console.error('Failed to load members:', membersRes.reason);

      if (upcomingRes.status === 'rejected' && pastRes.status === 'rejected' && membersRes.status === 'rejected') {
        setError('Failed to connect to platform services. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
      setError(err.message || 'Failed to load home data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading fullPage message="Loading platform..." />;

  const featuredEvent = upcoming.length > 0 ? upcoming[0] : null;

  return (
    <div className="home-page">
      {/* ─── A. Editorial Hero ────────────────────────────── */}
      <section className="home-hero">
        <div className="container home-hero__container">
          <div className="home-hero__grid">
            <div className="home-hero__content animate-fade-in">
              <span className="eyebrow-label eyebrow-label--hero">Public Policy Club</span>
              <h1 className="home-hero__title">
                Research. Analysis. Awareness. Application. Reach.
              </h1>
              <p className="home-hero__desc">
                A community for students exploring policy, governance and civic thinking through rigorous debate and collaborative initiatives.
              </p>
              
              <div className="home-hero__welcome-wrap">
                <span className="home-hero__welcome">
                  Welcome back, <strong>{user?.name?.split(' ')[0]}</strong>
                </span>
              </div>

              <div className="home-hero__actions">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/activities')}
                  className="home-hero__btn"
                >
                  <span>View Upcoming Events</span>
                  <Icon name="arrow-right" size={15} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container home-body">
        {/* ─── B & C. Featured Event & Compact Metrics ──────── */}
        <section className="home-spotlight-section">
          <div className="home-spotlight-grid">
            {/* Featured Event Card */}
            <div className="home-featured-card card-surface">
              {featuredEvent ? (
                <div className="home-featured-layout">
                  <div
                    className="home-featured-image"
                    style={{
                      backgroundImage: featuredEvent.coverImage
                        ? `url(${featuredEvent.coverImage})`
                        : 'url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop)',
                    }}
                  />
                  <div className="home-featured-content">
                    <div className="home-featured-tag">
                      <span className="eyebrow-label" style={{ color: 'var(--color-primary-light)', marginBottom: 0 }}>
                        Featured Event
                      </span>
                      {featuredEvent.category && (
                        <Badge variant="primary" size="sm">
                          {featuredEvent.category}
                        </Badge>
                      )}
                    </div>
                    <h2 className="home-featured-title">{featuredEvent.title}</h2>
                    <div className="home-featured-meta">
                      <span>
                        <Icon name="calendar" size={14} />
                        {formatDate(featuredEvent.date)}
                      </span>
                      {featuredEvent.time && (
                        <span>
                          <Icon name="clock" size={14} />
                          {featuredEvent.time}
                        </span>
                      )}
                      {featuredEvent.location && (
                        <span>
                          <Icon name="map-pin" size={14} />
                          {featuredEvent.location}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/activities/${featuredEvent.id}`)}
                      className="home-featured-btn"
                    >
                      <span>View Details</span>
                      <Icon name="arrow-right" size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="home-featured-empty">
                  <span className="eyebrow-label">Notice Board</span>
                  <h3 className="home-featured-title">No upcoming events scheduled</h3>
                  <p className="home-featured-desc">
                    New discussions and academic seminars are being organized. Check back soon.
                  </p>
                </div>
              )}
            </div>

            {/* Compact Club Metrics Strip */}
            <div className="home-metrics-card card-surface">
              <div className="home-metrics-item">
                <span className="home-metrics-num">{members.length}</span>
                <span className="home-metrics-label">Total Members</span>
              </div>
              <div className="home-metrics-divider" />
              <div className="home-metrics-item">
                <span className="home-metrics-num">{upcoming.length}</span>
                <span className="home-metrics-label">Upcoming Events</span>
              </div>
              <div className="home-metrics-divider" />
              <div className="home-metrics-item">
                <span className="home-metrics-num">{past.length}</span>
                <span className="home-metrics-label">Past Activities</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── D. Recent Activities ─────────────────────────── */}
        {past.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <div>
                <h2 className="section-title">Recent Activities</h2>
                <p className="home-section-subtitle">A record of our latest policy discussions, guest lectures, and student forums.</p>
              </div>
              <Link to="/activities" className="home-view-all-link">
                <span>View all</span>
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            <div className="grid-3">
              {past.slice(0, 6).map((activity) => (
                <div key={activity.id}>
                  <ActivityCard activity={activity} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

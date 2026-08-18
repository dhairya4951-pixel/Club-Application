import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { activityService } from '../../services/activityService';
import { memberService } from '../../services/memberService';
import ActivityCard from '../../components/activity/ActivityCard';
import StatCard from '../../components/dashboard/StatCard';
import Loading from '../../components/common/Loading';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [upcomingRes, pastRes, membersRes] = await Promise.all([
          activityService.getUpcoming(),
          activityService.getPast(),
          memberService.getAll(),
        ]);
        setUpcoming(upcomingRes);
        setPast(pastRes);
        setMembers(membersRes);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading fullPage message="Loading home..." />;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="container hero__content">
          <div className="hero__text animate-slide-up">
            <span className="hero__badge">College Club Platform</span>
            <h1 className="hero__title">The Policy Circle</h1>
            <p className="hero__desc">
              Fostering civic awareness, critical thinking, and leadership through
              engaging discussions, workshops, and community initiatives.
            </p>
            <p className="hero__welcome">
              Welcome back, <strong>{user?.name?.split(' ')[0]}</strong>! 👋
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Quick Stats */}
        <section className="home-section animate-fade-in">
          <div className="grid-3">
            <StatCard icon="👥" label="Total Members" value={members.length} color="primary" />
            <StatCard icon="📅" label="Upcoming Events" value={upcoming.length} color="accent" />
            <StatCard icon="✅" label="Past Activities" value={past.length} color="info" />
          </div>
        </section>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <section className="home-section">
            <h2 className="section-title">📅 Upcoming Events</h2>
            <div className="grid-3">
              {upcoming.map((activity, i) => (
                <div key={activity.id} className={`stagger-${i + 1}`} style={{ opacity: 0, animation: `slideUp 400ms ease forwards ${i * 100}ms` }}>
                  <ActivityCard activity={activity} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Past Activities */}
        {past.length > 0 && (
          <section className="home-section">
            <h2 className="section-title">🏆 Recent Activities</h2>
            <div className="grid-3">
              {past.slice(0, 6).map((activity, i) => (
                <div key={activity.id} style={{ opacity: 0, animation: `slideUp 400ms ease forwards ${i * 100}ms` }}>
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

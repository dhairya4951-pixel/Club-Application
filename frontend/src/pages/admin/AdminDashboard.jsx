import { useState, useEffect } from 'react';
import { memberService } from '../../services/memberService';
import { activityService } from '../../services/activityService';
import StatCard from '../../components/dashboard/StatCard';
import QuickAction from '../../components/dashboard/QuickAction';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/helpers';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [m, a] = await Promise.all([
          memberService.getAll(),
          activityService.getAll(),
        ]);
        setMembers(m);
        setActivities(a);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading fullPage message="Loading dashboard..." />;

  const upcoming = activities.filter(a => a.status === 'upcoming');
  const completed = activities.filter(a => a.status === 'completed');
  const recent = [...activities].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  return (
    <div className="container">
      <div className="page-header">
        <h1>⚡ Admin Dashboard</h1>
        <p>Manage your club from one place</p>
      </div>

      {/* Stats */}
      <div className="grid-4 admin-stats animate-fade-in">
        <StatCard icon="👥" label="Total Members" value={members.length} color="primary" />
        <StatCard icon="📅" label="Upcoming Events" value={upcoming.length} color="accent" />
        <StatCard icon="✅" label="Completed" value={completed.length} color="info" />
        <StatCard icon="📋" label="Total Activities" value={activities.length} color="warning" />
      </div>

      {/* Quick Actions */}
      <section className="admin-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid-4">
          <QuickAction icon="➕" label="Create Member" to="/admin/members" />
          <QuickAction icon="📝" label="Create Activity" to="/admin/activities" />
          <QuickAction icon="✅" label="Manage Attendance" to="/admin/attendance" />
          <QuickAction icon="⭐" label="Manage Engagement" to="/admin/engagement" />
          <QuickAction icon="👥" label="View Members" to="/members" />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="admin-section">
        <h2 className="section-title">Recent Activity</h2>
        <div className="admin-recent-list">
          {recent.map((activity, i) => (
            <div key={activity.id} className="admin-recent-item animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="admin-recent-item__info">
                <span className="admin-recent-item__title">{activity.title}</span>
                <span className="admin-recent-item__meta">
                  {activity.status} · {formatDate(activity.date)}
                </span>
              </div>
              <span className={`admin-recent-item__status admin-recent-item__status--${activity.status}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

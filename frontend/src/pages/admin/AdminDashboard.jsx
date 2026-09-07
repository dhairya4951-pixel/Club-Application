import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { memberService } from '../../services/memberService';
import { activityService } from '../../services/activityService';
import StatCard from '../../components/dashboard/StatCard';
import QuickAction from '../../components/dashboard/QuickAction';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import Icon from '../../components/common/Icon';
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
  const recent = [...activities].sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date)).slice(0, 6);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'upcoming': return 'info';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="container admin-dashboard-page">
      <div className="page-header">
        <div className="page-header-badge">
          <Icon name="shield" size={14} /> Administration Control
        </div>
        <h1 className="editorial-title">Club Overview & Management</h1>
        <p className="page-subtitle">
          Centralized administrative governance for member rosters, event schedules, attendance registries, and engagement metrics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4 admin-stats animate-fade-in">
        <StatCard icon="users" label="Total Members" value={members.length} color="primary" />
        <StatCard icon="calendar" label="Upcoming Events" value={upcoming.length} color="accent" />
        <StatCard icon="check-circle" label="Completed Events" value={completed.length} color="info" />
        <StatCard icon="document" label="Total Activities" value={activities.length} color="warning" />
      </div>

      {/* Quick Actions */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">Administrative Actions</h2>
          <span className="admin-section__desc">Access management registries and update club records</span>
        </div>
        <div className="grid-4 admin-actions-grid">
          <QuickAction icon="user" label="Manage Members" to="/admin/members" />
          <QuickAction icon="calendar" label="Manage Activities" to="/admin/activities" />
          <QuickAction icon="check-circle" label="Manage Attendance" to="/admin/attendance" />
          <QuickAction icon="award" label="Manage Engagement" to="/admin/engagement" />
          <QuickAction icon="message" label="Manage Discussion" to="/admin/discussion" />
          <QuickAction icon="users" label="Public Roster" to="/members" />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">Recent Activity Log</h2>
          <Link to="/admin/activities" className="admin-section__link">
            View All Activities <Icon name="chevron-right" size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="card-surface admin-empty-log">
            <p>No activities recorded yet.</p>
          </div>
        ) : (
          <div className="card-surface admin-recent-card">
            <div className="admin-recent-list">
              {recent.map((activity, i) => (
                <div key={activity.id} className="admin-recent-item animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="admin-recent-item__main">
                    <div className="admin-recent-item__icon">
                      <Icon name="calendar" size={18} />
                    </div>
                    <div className="admin-recent-item__info">
                      <Link to={`/activities/${activity.id}`} className="admin-recent-item__title">
                        {activity.title}
                      </Link>
                      <div className="admin-recent-item__meta">
                        <span><Icon name="calendar" size={12} /> {formatDate(activity.date)}</span>
                        {activity.location && (
                          <span><Icon name="map-pin" size={12} /> {activity.location}</span>
                        )}
                        {activity.type && (
                          <span className="admin-recent-item__type">{activity.type}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="admin-recent-item__actions">
                    <Badge variant={getStatusBadgeVariant(activity.status)}>
                      {activity.status}
                    </Badge>
                    <Link to={`/admin/attendance/${activity.id}`} className="admin-recent-item__btn" title="Take attendance">
                      <Icon name="check-circle" size={15} /> Attendance
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

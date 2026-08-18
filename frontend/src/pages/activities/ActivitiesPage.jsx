import { useState, useEffect } from 'react';
import { activityService } from '../../services/activityService';
import ActivityCard from '../../components/activity/ActivityCard';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import './ActivitiesPage.css';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchActivities() {
      try {
        const data = await activityService.getAll();
        setActivities(data);
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  const filtered = activities.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  if (loading) return <Loading fullPage message="Loading activities..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Activities & Events</h1>
        <p>Browse all club activities, events, and workshops</p>
      </div>

      <div className="activities-filters">
        {['all', 'upcoming', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No activities found"
          message={`No ${filter !== 'all' ? filter : ''} activities yet.`}
        />
      ) : (
        <div className="grid-3">
          {filtered.map((activity, i) => (
            <div key={activity.id} style={{ opacity: 0, animation: `slideUp 400ms ease forwards ${i * 80}ms` }}>
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

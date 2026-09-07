import { useState, useEffect } from 'react';
import { activityService } from '../../services/activityService';
import ActivityCard from '../../components/activity/ActivityCard';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import './ActivitiesPage.css';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <Loading fullPage message="Loading activities..." />;

  return (
    <div className="container activities-page">
      <div className="page-header">
        <span className="eyebrow-label">Club Archive</span>
        <h1>Activities & Events</h1>
        <p>Conversations, workshops and initiatives that shape the club and inspire public policy debate.</p>
      </div>

      <div className="activities-controls">
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

        <div className="activities-search-wrap">
          <Icon name="search" size={16} className="activities-search-icon" />
          <input
            type="text"
            className="activities-search-input"
            placeholder="Search activities by topic or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="activities-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No activities found"
          message={search ? `No activities match "${search}".` : `No ${filter !== 'all' ? filter : ''} activities recorded yet.`}
        />
      ) : (
        <div className="grid-3">
          {filtered.map((activity) => (
            <div key={activity.id}>
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

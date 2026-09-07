import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Icon from '../../components/common/Icon';
import { formatDate, getStatusColor } from '../../utils/helpers';

export default function ManageAttendance() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetch() {
      try {
        const data = await activityService.getAll();
        setActivities(data.filter(a => a.status !== 'cancelled'));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return <Loading fullPage message="Loading attendance records..." />;

  const statusLabels = { upcoming: 'Upcoming', completed: 'Completed' };

  // Sort: completed first, then upcoming
  const sorted = [...activities].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div className="container manage-attendance-page">
      <div className="page-header">
        <div className="page-header-badge">
          <Icon name="check-circle" size={14} /> Attendance Governance
        </div>
        <h1 className="editorial-title">Attendance Registry</h1>
        <p className="page-subtitle">Select a completed club session to verify, record, or modify member attendance rosters.</p>
      </div>

      <div className="manage-table-wrapper card-surface">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Activity Title</th>
              <th>Session Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => (
              <tr key={a.id}>
                <td>
                  <span className="manage-member-name">{a.title}</span>
                  {a.location && (
                    <span className="manage-member-email">
                      <Icon name="map-pin" size={11} /> {a.location}
                    </span>
                  )}
                </td>
                <td className="nowrap">
                  <span className="activity-table-date">{formatDate(a.date)}</span>
                  {a.time && <span className="activity-table-time">{a.time}</span>}
                </td>
                <td><Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status] || a.status}</Badge></td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {a.status === 'completed' ? (
                      <Button variant="primary" size="sm" onClick={() => navigate(`/admin/attendance/${a.id}`)}>
                        <Icon name="check-circle" size={14} /> Open Roster
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="clock" size={12} /> Available upon completion
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="manage-mobile-list">
        {sorted.map(a => (
          <div key={a.id} className="manage-mobile-card card-surface">
            <span className="manage-member-name">{a.title}</span>
            <span className="manage-member-email">{formatDate(a.date)} {a.time ? `· ${a.time}` : ''}</span>
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status] || a.status}</Badge>
              {a.status === 'completed' ? (
                <Button variant="primary" size="sm" onClick={() => navigate(`/admin/attendance/${a.id}`)}>
                  <Icon name="check-circle" size={14} /> Open Roster
                </Button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Available upon completion
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

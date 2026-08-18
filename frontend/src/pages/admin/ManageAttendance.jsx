import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
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

  if (loading) return <Loading fullPage message="Loading..." />;

  const statusLabels = { upcoming: 'Upcoming', completed: 'Completed' };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Manage Attendance</h1>
        <p>Select an activity to manage its attendance records</p>
      </div>
      <div className="manage-table-wrapper">
        <table className="manage-table">
          <thead><tr><th>Activity</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td><span className="manage-member-name">{a.title}</span></td>
                <td className="nowrap">{formatDate(a.date)}</td>
                <td><Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status] || a.status}</Badge></td>
                <td><Button variant="primary" size="sm" onClick={() => navigate(`/admin/attendance/${a.id}`)}>Manage</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="manage-mobile-list">
        {activities.map(a => (
          <div key={a.id} className="manage-mobile-card">
            <span className="manage-member-name">{a.title}</span>
            <span className="manage-member-email">{formatDate(a.date)}</span>
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status] || a.status}</Badge>
              <Button variant="primary" size="sm" onClick={() => navigate(`/admin/attendance/${a.id}`)}>Manage</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

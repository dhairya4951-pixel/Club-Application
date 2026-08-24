import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { getInitials, formatDate } from '../../utils/helpers';
import './ActivityAttendancePage.css';

export default function ActivityAttendancePage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetch() {
      try {
        const result = await attendanceService.getActivityAttendance(activityId);
        setData(result);
        setRecords(result.records.map(r => ({ memberId: r.memberId || r.member_id, status: r.status })));
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load attendance data.');
      }
      finally { setLoading(false); }
    }
    fetch();
  }, [activityId]);

  const toggleStatus = (memberId) => {
    setRecords(prev => prev.map(r =>
      r.memberId === memberId
        ? { ...r, status: r.status === 'present' ? 'absent' : 'present' }
        : r
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceService.updateActivityAttendance(activityId, records);
      setMessage('Attendance saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading fullPage message="Loading attendance..." />;
  if (error) {
    return (
      <div className="container">
        <button className="back-link" onClick={() => navigate('/admin/attendance')}>← Back to Attendance</button>
        <div className="profile-error" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-xl)', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>⚠️ Attendance Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return <div className="container"><p>Activity not found</p></div>;

  return (
    <div className="container">
      <button className="back-link" onClick={() => navigate('/admin/attendance')}>← Back to Attendance</button>

      <div className="page-header">
        <h1>{data.activity.title}</h1>
        <p>{formatDate(data.activity.date)} · {data.activity.time}</p>
      </div>

      {message && <div className="profile-success">{message}</div>}

      <div className="att-table-wrapper">
        <table className="manage-table">
          <thead>
            <tr><th>Member</th><th>Status</th><th>Toggle</th></tr>
          </thead>
          <tbody>
            {data.records.map((record, i) => {
              const rowMemberId = record.memberId || record.member_id;
              const currentStatus = records.find(r => r.memberId === rowMemberId)?.status || record.status;
              return (
                <tr key={rowMemberId || i}>
                  <td>
                    <div className="manage-member-cell">
                      <div className="manage-member-avatar">{getInitials(record.member?.name)}</div>
                      <span className="manage-member-name">{record.member?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`att-status att-status--${currentStatus}`}>
                      {currentStatus === 'present' ? '✓ Present' : '✗ Absent'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`att-toggle ${currentStatus === 'present' ? 'att-toggle--present' : 'att-toggle--absent'}`}
                      onClick={() => toggleStatus(rowMemberId)}
                    >
                      {currentStatus === 'present' ? 'Mark Absent' : 'Mark Present'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile version */}
      <div className="manage-mobile-list">
        {data.records.map((record, i) => {
          const rowMemberId = record.memberId || record.member_id;
          const currentStatus = records.find(r => r.memberId === rowMemberId)?.status || record.status;
          return (
            <div key={rowMemberId || i} className="manage-mobile-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="manage-member-cell">
                <div className="manage-member-avatar">{getInitials(record.member?.name)}</div>
                <span className="manage-member-name">{record.member?.name}</span>
              </div>
              <button
                className={`att-toggle ${currentStatus === 'present' ? 'att-toggle--present' : 'att-toggle--absent'}`}
                onClick={() => toggleStatus(rowMemberId)}
              >
                {currentStatus === 'present' ? '✓ Present' : '✗ Absent'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>Save Attendance</Button>
      </div>
    </div>
  );
}

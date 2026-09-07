import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Icon from '../../components/common/Icon';
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

  const markAll = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceService.updateActivityAttendance(activityId, records);
      setMessage('Attendance saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullPage message="Loading attendance roster..." />;

  if (error) {
    return (
      <div className="container">
        <button className="back-link" onClick={() => navigate('/admin/attendance')}>
          <Icon name="arrow-left" size={14} /> Back to Attendance
        </button>
        <div className="profile-error" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-xl)', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <Icon name="alert-circle" size={24} style={{ marginBottom: 'var(--space-xs)' }} />
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>Attendance Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="container"><p>Activity not found</p></div>;

  const totalMembers = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = totalMembers - presentCount;
  const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

  return (
    <div className="container activity-attendance-page">
      <button className="back-link" onClick={() => navigate('/admin/attendance')}>
        <Icon name="arrow-left" size={14} /> Back to Attendance List
      </button>

      <div className="page-header activity-attendance-header">
        <div>
          <div className="page-header-badge">
            <Icon name="calendar" size={14} /> Official Session Roster
          </div>
          <h1 className="editorial-title">{data.activity.title}</h1>
          <p className="page-subtitle">
            <Icon name="calendar" size={14} /> {formatDate(data.activity.date)}
            {data.activity.time && <> · <Icon name="clock" size={14} /> {data.activity.time}</>}
            {data.activity.location && <> · <Icon name="map-pin" size={14} /> {data.activity.location}</>}
          </p>
        </div>
        <div className="activity-attendance-header-actions">
          <Button variant="primary" size="md" onClick={handleSave} loading={saving}>
            <Icon name="save" size={16} /> Save Attendance
          </Button>
        </div>
      </div>

      {message && (
        <div className="profile-success" style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="check-circle" size={16} /> {message}
        </div>
      )}

      {/* Summary Statistics Strip */}
      <div className="attendance-summary-grid">
        <div className="card-surface attendance-summary-card">
          <span className="attendance-summary-label">Total Enrolled</span>
          <span className="attendance-summary-value">{totalMembers}</span>
        </div>
        <div className="card-surface attendance-summary-card attendance-summary-card--present">
          <span className="attendance-summary-label">Marked Present</span>
          <span className="attendance-summary-value">{presentCount}</span>
        </div>
        <div className="card-surface attendance-summary-card attendance-summary-card--absent">
          <span className="attendance-summary-label">Marked Absent</span>
          <span className="attendance-summary-value">{absentCount}</span>
        </div>
        <div className="card-surface attendance-summary-card">
          <span className="attendance-summary-label">Turnout Rate</span>
          <span className="attendance-summary-value">{attendanceRate}%</span>
        </div>
      </div>

      {/* Bulk Action Controls */}
      <div className="attendance-toolbar card-surface">
        <span className="attendance-toolbar-label">Quick Actions:</span>
        <div className="attendance-toolbar-buttons">
          <Button variant="secondary" size="sm" onClick={() => markAll('present')}>
            <Icon name="check-circle" size={14} /> Mark All Present
          </Button>
          <Button variant="secondary" size="sm" onClick={() => markAll('absent')}>
            <Icon name="close" size={14} /> Mark All Absent
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="att-table-wrapper card-surface">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Current Status</th>
              <th style={{ textAlign: 'right' }}>Attendance Toggle</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((record, i) => {
              const rowMemberId = record.memberId || record.member_id;
              const currentStatus = records.find(r => r.memberId === rowMemberId)?.status || record.status;
              const isPresent = currentStatus === 'present';
              return (
                <tr key={rowMemberId || i}>
                  <td>
                    <div className="manage-member-cell">
                      <div className="manage-member-avatar">{getInitials(record.member?.name)}</div>
                      <div>
                        <span className="manage-member-name">{record.member?.name || 'Unknown'}</span>
                        {record.member?.email && (
                          <span className="manage-member-email">{record.member.email}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`att-status-badge ${isPresent ? 'att-status-badge--present' : 'att-status-badge--absent'}`}>
                      <Icon name={isPresent ? 'check-circle' : 'close'} size={13} />
                      {isPresent ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className={`att-toggle-btn ${isPresent ? 'att-toggle-btn--present' : 'att-toggle-btn--absent'}`}
                        onClick={() => toggleStatus(rowMemberId)}
                      >
                        <Icon name={isPresent ? 'close' : 'check-circle'} size={13} />
                        {isPresent ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="manage-mobile-list">
        {data.records.map((record, i) => {
          const rowMemberId = record.memberId || record.member_id;
          const currentStatus = records.find(r => r.memberId === rowMemberId)?.status || record.status;
          const isPresent = currentStatus === 'present';
          return (
            <div key={rowMemberId || i} className="manage-mobile-card card-surface" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <div className="manage-member-cell">
                <div className="manage-member-avatar">{getInitials(record.member?.name)}</div>
                <div>
                  <span className="manage-member-name">{record.member?.name}</span>
                  <span className={`att-status-badge ${isPresent ? 'att-status-badge--present' : 'att-status-badge--absent'}`} style={{ marginTop: '4px' }}>
                    <Icon name={isPresent ? 'check-circle' : 'close'} size={12} />
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              </div>
              <button
                className={`att-toggle-btn ${isPresent ? 'att-toggle-btn--present' : 'att-toggle-btn--absent'}`}
                onClick={() => toggleStatus(rowMemberId)}
              >
                {isPresent ? 'Mark Absent' : 'Mark Present'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
          <Icon name="save" size={16} /> Save Attendance Records
        </Button>
      </div>
    </div>
  );
}

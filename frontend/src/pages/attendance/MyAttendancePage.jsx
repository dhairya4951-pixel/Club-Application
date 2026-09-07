import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import { formatDate } from '../../utils/helpers';
import './MyAttendancePage.css';

export default function MyAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const result = await attendanceService.getMyAttendance();
        setData(result);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  if (loading) return <Loading fullPage message="Loading attendance records..." />;

  if (!data || data.records.length === 0) {
    return (
      <div className="container attendance-page">
        <div className="page-header">
          <span className="eyebrow-label">Member Records</span>
          <h1>My Attendance</h1>
          <p>Track your attendance history and active participation across club sessions.</p>
        </div>
        <EmptyState
          icon="chart"
          title="No attendance records"
          message="You don't have any logged attendance records yet. Attend an event to begin building your record."
        />
      </div>
    );
  }

  const { stats, records } = data;

  return (
    <div className="container attendance-page">
      <div className="page-header">
        <span className="eyebrow-label">Member Records</span>
        <h1>My Attendance</h1>
        <p>Track your attendance history and active participation across club sessions.</p>
      </div>

      {/* ─── Hero Attendance Metric Card ─────────────────── */}
      <div className="attendance-hero-card card-surface animate-fade-in">
        <div className="attendance-hero-card__gauge-wrap">
          <div className="attendance-hero-card__circle">
            <span className="attendance-hero-card__pct">{stats.attendancePercentage}%</span>
            <span className="attendance-hero-card__pct-label">Attendance</span>
          </div>
        </div>

        <div className="attendance-hero-card__details">
          <div className="attendance-hero-metric">
            <span className="attendance-hero-metric__val">{stats.attended}</span>
            <span className="attendance-hero-metric__label">Sessions Attended</span>
          </div>
          <div className="attendance-hero-metric-divider" />
          <div className="attendance-hero-metric">
            <span className="attendance-hero-metric__val">{stats.missed}</span>
            <span className="attendance-hero-metric__label">Sessions Missed</span>
          </div>
          <div className="attendance-hero-metric-divider" />
          <div className="attendance-hero-metric">
            <span className="attendance-hero-metric__val">{stats.totalActivities}</span>
            <span className="attendance-hero-metric__label">Total Sessions</span>
          </div>
        </div>
      </div>

      {/* ─── Activity History List ────────────────────────── */}
      <section className="attendance-records-section">
        <div className="attendance-records-header">
          <h2 className="section-title">Activity History</h2>
          <span className="attendance-count-badge">{records.length} Records</span>
        </div>

        <div className="attendance-list card-surface">
          {records.map((record) => (
            <div key={record.id} className="attendance-row">
              <div className="attendance-row__indicator">
                <span
                  className={`attendance-dot ${
                    record.status === 'present' ? 'attendance-dot--present' : 'attendance-dot--absent'
                  }`}
                >
                  <Icon name={record.status === 'present' ? 'check' : 'x'} size={12} />
                </span>
              </div>

              <div className="attendance-row__info">
                <span className="attendance-row__title">
                  {record.activity?.title || 'Club Session'}
                </span>
                <span className="attendance-row__meta">
                  <Icon name="calendar" size={13} />
                  {formatDate(record.activity?.date)}
                </span>
              </div>

              <div className="attendance-row__badge">
                <Badge variant={record.status === 'present' ? 'success' : 'error'} size="sm">
                  {record.status === 'present' ? 'Present' : 'Absent'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

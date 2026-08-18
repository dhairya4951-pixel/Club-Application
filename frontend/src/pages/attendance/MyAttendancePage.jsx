import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import StatCard from '../../components/dashboard/StatCard';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
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

  if (loading) return <Loading fullPage message="Loading attendance..." />;

  if (!data || data.records.length === 0) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>My Activities</h1>
          <p>Track your attendance and activity participation</p>
        </div>
        <EmptyState icon="📊" title="No attendance records" message="You don't have any attendance records yet." />
      </div>
    );
  }

  const { stats, records } = data;

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Activities</h1>
        <p>Track your attendance and activity participation</p>
      </div>

      {/* Stats */}
      <div className="grid-4 attendance-stats animate-fade-in">
        <StatCard icon="📋" label="Total Activities" value={stats.totalActivities} color="primary" />
        <StatCard icon="✅" label="Attended" value={stats.attended} color="accent" />
        <StatCard icon="❌" label="Missed" value={stats.missed} color="warning" />
        <StatCard icon="📊" label="Attendance %" value={`${stats.attendancePercentage}%`} color="info" />
      </div>

      {/* Records */}
      <section className="attendance-records">
        <h2 className="section-title">Activity History</h2>
        <div className="attendance-list">
          {records.map((record, i) => (
            <div
              key={record.id}
              className="attendance-item animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className={`attendance-icon ${record.status === 'present' ? 'attendance-icon--present' : 'attendance-icon--absent'}`}>
                {record.status === 'present' ? '✓' : '✗'}
              </span>
              <div className="attendance-item__info">
                <span className="attendance-item__title">{record.activity?.title || 'Unknown Activity'}</span>
                <span className="attendance-item__date">{formatDate(record.activity?.date)}</span>
              </div>
              <Badge variant={record.status === 'present' ? 'success' : 'error'} size="sm">
                {record.status === 'present' ? 'Present' : 'Absent'}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

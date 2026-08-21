import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { engagementService } from '../../services/engagementService';
import { contributionService } from '../../services/contributionService';
import { memberService } from '../../services/memberService';
import AddContributionModal from '../../components/engagement/AddContributionModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate, formatDateShort, getInitials } from '../../utils/helpers';
import './ManageEngagement.css';

function getLevelColor(level) {
  switch (level) {
    case 'Excellent': case 'High': case 'Highly Engaged': return 'success';
    case 'Good': case 'Moderate': case 'Active': return 'info';
    case 'Emerging': case 'Moderately Active': return 'warning';
    default: return 'muted';
  }
}

export default function ManageEngagement() {
  const navigate = useNavigate();
  const [engagementData, setEngagementData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberContribs, setMemberContribs] = useState([]);
  const [loadingContribs, setLoadingContribs] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContrib, setEditingContrib] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [engData, memData] = await Promise.all([
        engagementService.getAllEngagement(),
        memberService.getAll(),
      ]);
      setEngagementData(engData);
      setMembers(memData);
    } catch (err) {
      console.error('Failed to load engagement data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMemberContribs(memberId) {
    setLoadingContribs(true);
    try {
      const data = await contributionService.getByMember(memberId);
      setMemberContribs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContribs(false);
    }
  }

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    fetchMemberContribs(member.member.id);
  };

  const handleAddContribution = () => {
    setEditingContrib(null);
    setShowAddModal(true);
  };

  const handleEditContrib = (contrib) => {
    setEditingContrib(contrib);
    setShowAddModal(true);
  };

  const handleDeleteContrib = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contributionService.remove(deleteTarget.id);
      setDeleteTarget(null);
      // Refresh
      if (selectedMember) fetchMemberContribs(selectedMember.member.id);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleContributionSuccess = () => {
    if (selectedMember) fetchMemberContribs(selectedMember.member.id);
    fetchData();
  };

  const filtered = engagementData.filter(e =>
    e.member.name.toLowerCase().includes(search.toLowerCase()) ||
    e.member.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading fullPage message="Loading engagement data..." />;

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>Member Engagement</h1>
          <p>View and manage member activity and contributions</p>
        </div>
        <Button variant="primary" onClick={handleAddContribution}>+ Add Contribution</Button>
      </div>

      {/* Search */}
      <div className="engagement-search">
        <input
          type="text"
          className="form-input"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="engagement-layout">
        {/* Member List */}
        <div className="engagement-member-list">
          {filtered.map((e, i) => (
            <div
              key={e.member.id}
              className={`engagement-member-card ${selectedMember?.member.id === e.member.id ? 'engagement-member-card--active' : ''}`}
              onClick={() => handleSelectMember(e)}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="engagement-member-card__header">
                <div className="engagement-member-card__avatar">{getInitials(e.member.name)}</div>
                <div className="engagement-member-card__info">
                  <span className="engagement-member-card__name">{e.member.name}</span>
                  <span className="engagement-member-card__email">{e.member.email}</span>
                </div>
              </div>
              <div className="engagement-member-card__stats">
                <div className="engagement-mini-stat">
                  <span className="engagement-mini-stat__label">Attendance</span>
                  <span className="engagement-mini-stat__value">{e.attendance.percentage}%</span>
                </div>
                <div className="engagement-mini-stat">
                  <span className="engagement-mini-stat__label">Points</span>
                  <span className="engagement-mini-stat__value">{e.contribution.totalPoints}</span>
                </div>
                <Badge variant={getLevelColor(e.overallLabel)} size="sm">{e.overallLabel}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="engagement-detail-panel">
          {!selectedMember ? (
            <div className="engagement-detail-empty">
              <span style={{ fontSize: '3rem' }}>👈</span>
              <p>Select a member to view their engagement details</p>
            </div>
          ) : (
            <>
              <div className="engagement-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div className="engagement-member-card__avatar" style={{ width: 48, height: 48, fontSize: 'var(--font-size-lg)' }}>
                    {getInitials(selectedMember.member.name)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedMember.member.name}</h2>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      {selectedMember.member.email}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/engagement/${selectedMember.member.id}`)}>
                    View Full Profile
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddContribution}>
                    + Add Contribution
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="engagement-detail-stats">
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Attendance</span>
                  <span className="engagement-detail-stat__value">{selectedMember.attendance.percentage}%</span>
                  <Badge variant={getLevelColor(selectedMember.activityLevel)} size="sm">{selectedMember.activityLevel}</Badge>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Discussion</span>
                  <span className="engagement-detail-stat__value">{selectedMember.discussion.meaningfulMessages} msgs</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{selectedMember.discussion.activeDays} days</span>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Points</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.totalPoints}</span>
                  <Badge variant={getLevelColor(selectedMember.contributionLevel)} size="sm">{selectedMember.contributionLevel}</Badge>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Tasks</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.taskCount}</span>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Resources</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.resourceCount}</span>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Events</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.eventOrganizedCount + selectedMember.contribution.eventSupportCount}</span>
                </div>
              </div>

              {/* Contribution History */}
              <h3 className="section-title" style={{ marginTop: 'var(--space-xl)' }}>Contribution History</h3>
              {loadingContribs ? (
                <Loading message="Loading..." />
              ) : memberContribs.length === 0 ? (
                <div className="engagement-empty-contribs">
                  <p>No contributions recorded yet.</p>
                </div>
              ) : (
                <div className="engagement-contrib-list">
                  {memberContribs.map(c => (
                    <div key={c.id} className="engagement-contrib-item">
                      <div className="engagement-contrib-item__icon">{c.categoryIcon}</div>
                      <div className="engagement-contrib-item__content">
                        <span className="engagement-contrib-item__title">{c.title}</span>
                        <span className="engagement-contrib-item__meta">
                          {c.typeLabel} · {formatDateShort(c.date)} · Recorded by {c.recorder?.name || 'Admin'}
                        </span>
                        {c.description && (
                          <span className="engagement-contrib-item__desc">{c.description}</span>
                        )}
                      </div>
                      <div className="engagement-contrib-item__right">
                        <span className="timeline-points">+{c.points}</span>
                        <div className="manage-actions" style={{ marginTop: 'var(--space-xs)' }}>
                          <Button variant="ghost" size="sm" onClick={() => handleEditContrib(c)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteTarget(c)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddContributionModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingContrib(null); }}
        onSuccess={handleContributionSuccess}
        members={members}
        editingContribution={editingContrib}
        preselectedMemberId={selectedMember?.member.id}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteContrib}
        title="Delete Contribution"
        message={`Delete "${deleteTarget?.title}" (+${deleteTarget?.points} pts)? This action will be logged in the audit trail.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}

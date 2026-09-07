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
import Icon from '../../components/common/Icon';
import { formatDateShort, getInitials } from '../../utils/helpers';
import './ManageEngagement.css';

function getLevelColor(level) {
  switch (level) {
    case 'Excellent': case 'High': case 'Highly Engaged': return 'success';
    case 'Good': case 'Moderate': case 'Active': return 'info';
    case 'Emerging': case 'Moderately Active': return 'warning';
    default: return 'neutral';
  }
}

const CATEGORY_ICONS = {
  TASK: 'document',
  RESOURCE: 'book',
  EVENT_SUPPORT: 'users',
  EVENT_ORGANIZED: 'award',
  MAJOR_RESPONSIBILITY: 'star',
};

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

  if (loading) return <Loading fullPage message="Loading engagement registry..." />;

  return (
    <div className="container manage-engagement-page">
      <div className="page-header manage-engagement-header">
        <div>
          <div className="page-header-badge">
            <Icon name="award" size={14} /> Merit & Engagement Governance
          </div>
          <h1 className="editorial-title">Member Engagement & Contributions</h1>
          <p className="page-subtitle">Record and audit verified member contributions, monitor attendance records, and review standing.</p>
        </div>
        <Button variant="primary" onClick={handleAddContribution}>
          <Icon name="plus" size={16} /> Log Contribution
        </Button>
      </div>

      {/* Search Bar */}
      <div className="engagement-search card-surface">
        <div className="engagement-search-inner">
          <Icon name="search" size={16} className="engagement-search-icon" />
          <input
            type="text"
            className="engagement-search-input"
            placeholder="Search member registry by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="engagement-layout">
        {/* Member List */}
        <div className="engagement-member-list">
          <div className="engagement-list-title">
            <span>Members ({filtered.length})</span>
          </div>
          {filtered.map((e, i) => (
            <div
              key={e.member.id}
              className={`engagement-member-card card-surface ${selectedMember?.member.id === e.member.id ? 'engagement-member-card--active' : ''}`}
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
                  <span className="engagement-mini-stat__label">Merit Pts</span>
                  <span className="engagement-mini-stat__value">{e.contribution.totalPoints}</span>
                </div>
                <Badge variant={getLevelColor(e.overallLabel)} size="sm">{e.overallLabel}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="engagement-detail-panel card-surface">
          {!selectedMember ? (
            <div className="engagement-detail-empty">
              <div className="engagement-detail-empty-icon">
                <Icon name="user" size={36} />
              </div>
              <h3>Select a Member</h3>
              <p>Choose an enrolled member from the directory on the left to inspect their attendance standing, points breakdown, and contribution audit trail.</p>
            </div>
          ) : (
            <>
              <div className="engagement-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div className="engagement-member-card__avatar" style={{ width: 50, height: 50, fontSize: 'var(--font-size-base)' }}>
                    {getInitials(selectedMember.member.name)}
                  </div>
                  <div>
                    <h2 className="engagement-detail-name">{selectedMember.member.name}</h2>
                    <span className="engagement-detail-email">
                      {selectedMember.member.email}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/engagement/${selectedMember.member.id}`)}>
                    <Icon name="external-link" size={14} /> Public Profile
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAddContribution}>
                    <Icon name="plus" size={14} /> Add Contribution
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="engagement-detail-stats">
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Attendance Rate</span>
                  <span className="engagement-detail-stat__value">{selectedMember.attendance.percentage}%</span>
                  <Badge variant={getLevelColor(selectedMember.activityLevel)} size="sm">{selectedMember.activityLevel}</Badge>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Forum Activity</span>
                  <span className="engagement-detail-stat__value">{selectedMember.discussion.meaningfulMessages} msgs</span>
                  <span className="engagement-detail-stat__sub">{selectedMember.discussion.activeDays} active days</span>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Merit Points</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.totalPoints}</span>
                  <Badge variant={getLevelColor(selectedMember.contributionLevel)} size="sm">{selectedMember.contributionLevel}</Badge>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Tasks Executed</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.taskCount}</span>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Research Pieces</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.resourceCount}</span>
                </div>
                <div className="engagement-detail-stat">
                  <span className="engagement-detail-stat__label">Events Supported</span>
                  <span className="engagement-detail-stat__value">{selectedMember.contribution.eventOrganizedCount + selectedMember.contribution.eventSupportCount}</span>
                </div>
              </div>

              {/* Contribution History */}
              <div className="engagement-history-header">
                <h3 className="engagement-history-title">Verified Contribution History</h3>
                <span className="engagement-history-count">{memberContribs.length} entries</span>
              </div>

              {loadingContribs ? (
                <Loading message="Loading contributions..." />
              ) : memberContribs.length === 0 ? (
                <div className="engagement-empty-contribs">
                  <p>No verified contributions logged for this member yet.</p>
                </div>
              ) : (
                <div className="engagement-contrib-list">
                  {memberContribs.map(c => {
                    const iconName = CATEGORY_ICONS[c.category] || 'document';
                    return (
                      <div key={c.id} className="engagement-contrib-item">
                        <div className="engagement-contrib-item__icon">
                          <Icon name={iconName} size={18} />
                        </div>
                        <div className="engagement-contrib-item__content">
                          <span className="engagement-contrib-item__title">{c.title}</span>
                          <span className="engagement-contrib-item__meta">
                            {c.typeLabel} · {formatDateShort(c.date)} · Logged by {c.recorder?.name || 'Faculty Admin'}
                          </span>
                          {c.description && (
                            <span className="engagement-contrib-item__desc">{c.description}</span>
                          )}
                        </div>
                        <div className="engagement-contrib-item__right">
                          <span className="timeline-points">+{c.points} pts</span>
                          <div className="manage-actions" style={{ marginTop: 'var(--space-xs)' }}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditContrib(c)}>
                              <Icon name="edit" size={13} /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteTarget(c)}>
                              <Icon name="trash" size={13} /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
        title="Delete Contribution Record"
        message={`Permanently remove "${deleteTarget?.title}" (+${deleteTarget?.points} pts)? This deletion will be registered in the compliance audit trail.`}
        confirmText="Delete Record"
        loading={deleting}
      />
    </div>
  );
}

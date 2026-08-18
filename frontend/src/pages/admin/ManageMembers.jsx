import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { memberService } from '../../services/memberService';
import { getInitials, getPositionLabel } from '../../utils/helpers';
import PositionBadge from '../../components/member/PositionBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import './ManageMembers.css';

const LEADERSHIP_POSITIONS = ['president', 'vice_president', 'general_secretary'];

const POSITION_LABELS = {
  president: 'President',
  vice_president: 'Vice President',
  general_secretary: 'General Secretary',
};

const emptyForm = { name: '', email: '', password: '', course: '', year: '', bio: '' };

export default function ManageMembers() {
  const { isTeacher } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Create/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Position Management (Teacher-only)
  const [positionModal, setPositionModal] = useState(null); // { memberId, memberName }
  const [selectedPosition, setSelectedPosition] = useState('none');
  const [positionSaving, setPositionSaving] = useState(false);
  const [positionError, setPositionError] = useState('');

  // Replacement Confirmation
  const [replaceConfirm, setReplaceConfirm] = useState(null); // { memberId, position, currentHolder }

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ─── Create/Edit ───────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (member) => {
    // Prevent editing teacher account by non-teachers
    if (member.role === 'teacher_admin' && !isTeacher) return;

    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      course: member.course || '',
      year: member.year || '',
      bio: member.bio || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const { password, ...updates } = form;
        await memberService.update(editingId, updates);
      } else {
        if (!form.password || form.password.length < 6) {
          setError('Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        await memberService.create(form);
      }
      setShowModal(false);
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ────────────────────────────────────
  const handleDeleteClick = (member) => {
    // Can't delete teacher account
    if (member.role === 'teacher_admin') return;
    setDeleteTarget(member);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await memberService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchMembers();
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || 'Failed to delete member');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Position Management (Teacher-only) ────────
  const openPositionModal = (member) => {
    setPositionModal({ memberId: member.id, memberName: member.name });
    setSelectedPosition(member.position || 'none');
    setPositionError('');
  };

  const handlePositionSave = async () => {
    if (!positionModal) return;
    const { memberId } = positionModal;

    // If setting to 'none', use removePosition
    if (selectedPosition === 'none') {
      setPositionSaving(true);
      try {
        await memberService.removePosition(memberId);
        setPositionModal(null);
        await fetchMembers();
      } catch (err) {
        setPositionError(err.message || 'Failed to remove position');
      } finally {
        setPositionSaving(false);
      }
      return;
    }

    // Check if someone already holds this position
    const currentHolder = members.find(m =>
      m.position === selectedPosition && m.id !== memberId
    );

    if (currentHolder) {
      // Show replacement confirmation
      setReplaceConfirm({
        memberId,
        position: selectedPosition,
        currentHolder,
      });
      return;
    }

    // No conflict — assign directly
    await executePositionAssignment(memberId, selectedPosition);
  };

  const executePositionAssignment = async (memberId, position) => {
    setPositionSaving(true);
    setPositionError('');
    try {
      await memberService.assignPosition(memberId, position);
      setPositionModal(null);
      setReplaceConfirm(null);
      await fetchMembers();
    } catch (err) {
      setPositionError(err.message || 'Failed to assign position');
    } finally {
      setPositionSaving(false);
    }
  };

  // ─── Filtering ─────────────────────────────────
  const filtered = members.filter(m => {
    const matchesSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());

    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'leadership') {
      return matchesSearch && LEADERSHIP_POSITIONS.includes(m.position);
    }
    if (filterRole === 'teacher') {
      return matchesSearch && m.role === 'teacher_admin';
    }
    if (filterRole === 'member') {
      return matchesSearch && m.role === 'member' && !LEADERSHIP_POSITIONS.includes(m.position);
    }
    return matchesSearch;
  });

  // Get delete confirmation message
  const getDeleteMessage = () => {
    if (!deleteTarget) return '';
    if (LEADERSHIP_POSITIONS.includes(deleteTarget.position)) {
      return `⚠️ ${deleteTarget.name} currently holds the ${POSITION_LABELS[deleteTarget.position]} position. You must remove their position before deleting this account.`;
    }
    return `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`;
  };

  const canDeleteTarget = deleteTarget && !LEADERSHIP_POSITIONS.includes(deleteTarget.position);

  if (loading) return <Loading fullPage message="Loading members..." />;

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>Manage Members</h1>
          <p>Create, edit, and manage club member accounts</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Create Member</Button>
      </div>

      {/* Filters */}
      <div className="manage-filters">
        <input
          type="text"
          className="form-input manage-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="manage-role-filters">
          {[
            { value: 'all', label: 'All' },
            { value: 'teacher', label: 'Teacher' },
            { value: 'leadership', label: 'Leadership' },
            { value: 'member', label: 'Members' },
          ].map(f => (
            <button
              key={f.value}
              className={`filter-btn ${filterRole === f.value ? 'filter-btn--active' : ''}`}
              onClick={() => setFilterRole(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>⚠️ {error}</div>}

      {/* Members Table */}
      <div className="manage-table-wrapper">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Position</th>
              <th>Course</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => (
              <tr key={member.id}>
                <td>
                  <div className="manage-member-cell">
                    <div className="manage-member-avatar">{getInitials(member.name)}</div>
                    <div>
                      <span className="manage-member-name">{member.name}</span>
                      <span className="manage-member-email">{member.email}</span>
                    </div>
                  </div>
                </td>
                <td><PositionBadge position={member.position} role={member.role} size="sm" /></td>
                <td>{member.course || '—'}</td>
                <td>{member.year || '—'}</td>
                <td>
                  <div className="manage-actions">
                    {member.role !== 'teacher_admin' && (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>Edit</Button>
                    )}
                    {isTeacher && member.role !== 'teacher_admin' && (
                      <Button variant="ghost" size="sm" onClick={() => openPositionModal(member)} className="text-accent">Position</Button>
                    )}
                    {member.role !== 'teacher_admin' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(member)} className="text-danger">Delete</Button>
                    )}
                    {member.role === 'teacher_admin' && (
                      <span className="manage-member-email" style={{ fontStyle: 'italic' }}>Super Admin</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="manage-mobile-list">
        {filtered.map(member => (
          <div key={member.id} className="manage-mobile-card">
            <div className="manage-member-cell">
              <div className="manage-member-avatar">{getInitials(member.name)}</div>
              <div>
                <span className="manage-member-name">{member.name}</span>
                <span className="manage-member-email">{member.email}</span>
                <PositionBadge position={member.position} role={member.role} />
              </div>
            </div>
            {member.role !== 'teacher_admin' && (
              <div className="manage-actions" style={{ marginTop: 'var(--space-md)' }}>
                <Button variant="secondary" size="sm" onClick={() => openEdit(member)}>Edit</Button>
                {isTeacher && (
                  <Button variant="accent" size="sm" onClick={() => openPositionModal(member)}>Position</Button>
                )}
                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(member)}>Delete</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal — NO position field */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Member' : 'Create Member'} size="md">
        {error && <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>⚠️ {error}</div>}
        <FormField label="Name" name="name" value={form.name} onChange={handleChange} required />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        {!editingId && (
          <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Minimum 6 characters" />
        )}
        <FormField label="Course" name="course" value={form.course} onChange={handleChange} placeholder="e.g. B.A. Political Science" />
        <FormField label="Year" name="year" value={form.year} onChange={handleChange} placeholder="e.g. 3rd Year" />
        <FormField label="Bio" name="bio" type="textarea" value={form.bio} onChange={handleChange} rows={3} />
        <div className="profile-edit-actions">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editingId ? 'Save Changes' : 'Create Member'}</Button>
        </div>
      </Modal>

      {/* Position Management Modal (Teacher-only) */}
      {isTeacher && (
        <Modal
          isOpen={!!positionModal}
          onClose={() => { setPositionModal(null); setPositionError(''); }}
          title={`Manage Position — ${positionModal?.memberName}`}
          size="md"
        >
          {positionError && <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>⚠️ {positionError}</div>}

          <div className="position-selector">
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Select a leadership position for this member. Only one student can hold each position at a time.
            </p>

            {[
              { value: 'none', label: 'None / Normal Member' },
              { value: 'president', label: 'President' },
              { value: 'vice_president', label: 'Vice President' },
              { value: 'general_secretary', label: 'General Secretary' },
            ].map(opt => {
              const holder = opt.value !== 'none'
                ? members.find(m => m.position === opt.value && m.id !== positionModal?.memberId)
                : null;
              return (
                <label key={opt.value} className={`position-option ${selectedPosition === opt.value ? 'position-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name="position"
                    value={opt.value}
                    checked={selectedPosition === opt.value}
                    onChange={() => setSelectedPosition(opt.value)}
                  />
                  <div className="position-option__content">
                    <span className="position-option__label">{opt.label}</span>
                    {holder && (
                      <span className="position-option__holder">
                        Currently held by: <strong>{holder.name}</strong>
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="profile-edit-actions">
            <Button variant="secondary" onClick={() => setPositionModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handlePositionSave} loading={positionSaving}>Save Position</Button>
          </div>
        </Modal>
      )}

      {/* Replacement Confirmation */}
      <ConfirmDialog
        isOpen={!!replaceConfirm}
        onClose={() => setReplaceConfirm(null)}
        onConfirm={() => executePositionAssignment(replaceConfirm.memberId, replaceConfirm.position)}
        title="Replace Position Holder"
        message={
          replaceConfirm
            ? `${replaceConfirm.currentHolder.name} is currently the ${POSITION_LABELS[replaceConfirm.position]}. Assigning this position to ${positionModal?.memberName} will remove ${replaceConfirm.currentHolder.name}'s ${POSITION_LABELS[replaceConfirm.position]} role. Do you want to continue?`
            : ''
        }
        confirmText="Confirm Change"
        loading={positionSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={canDeleteTarget ? handleDelete : () => setDeleteTarget(null)}
        title={canDeleteTarget ? 'Delete Member' : 'Cannot Delete'}
        message={getDeleteMessage()}
        confirmText={canDeleteTarget ? 'Delete' : 'OK'}
        loading={deleting}
      />
    </div>
  );
}

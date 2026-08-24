import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import ImageUpload from '../../components/common/ImageUpload';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import { formatDate, getStatusColor } from '../../utils/helpers';
import './ManageActivities.css';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CATEGORY_OPTIONS = [
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Lecture', label: 'Lecture' },
  { value: 'Competition', label: 'Competition' },
  { value: 'Screening', label: 'Screening' },
  { value: 'Field Visit', label: 'Field Visit' },
  { value: 'Orientation', label: 'Orientation' },
  { value: 'Social', label: 'Social' },
  { value: 'Other', label: 'Other' },
];

const emptyForm = {
  title: '', description: '', date: '', time: '',
  location: '', status: 'upcoming', category: 'Other', coverImage: '',
};

export default function ManageActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(null);

  useEffect(() => { fetchActivities(); }, []);

  async function fetchActivities() {
    try {
      const data = await activityService.getAll();
      setActivities(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (activity) => {
    setEditingId(activity.id);
    setForm({
      title: activity.title, description: activity.description,
      date: activity.date, time: activity.time, location: activity.location,
      status: activity.status, category: activity.category || 'Other',
      coverImage: activity.coverImage || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await activityService.update(editingId, form);
      } else {
        await activityService.create(form);
      }
      setShowModal(false);
      await fetchActivities();
    } catch (err) {
      setError(err.message || 'Failed to save activity');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await activityService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchActivities();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  const handleMarkCompleted = async (activity) => {
    setCompleting(activity.id);
    try {
      await activityService.update(activity.id, { status: 'completed' });
      await fetchActivities();
    } catch (err) { console.error(err); }
    finally { setCompleting(null); }
  };

  // Image upload callback — sets the coverImage field to the returned URL
  const handleCoverImageChange = (url) => {
    setForm(p => ({ ...p, coverImage: url || '' }));
  };

  if (loading) return <Loading fullPage message="Loading activities..." />;

  const statusLabels = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>Manage Activities</h1>
          <p>Create and manage club events and activity posts</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Create Activity</Button>
      </div>

      {/* Desktop Table */}
      <div className="manage-table-wrapper">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Activity</th><th>Date</th><th>Status</th><th>Category</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="activity-cell">
                    {a.coverImage && (
                      <img src={a.coverImage} alt="" className="activity-cell__thumb" />
                    )}
                    <div>
                      <span className="manage-member-name">{a.title}</span>
                      <span className="manage-member-email">{a.location}</span>
                    </div>
                  </div>
                </td>
                <td className="nowrap">{formatDate(a.date)}</td>
                <td><Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status]}</Badge></td>
                <td>{a.category || '—'}</td>
                <td>
                  <div className="manage-actions">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(a)} className="text-danger">Delete</Button>
                    {a.status === 'upcoming' && (
                      <Button variant="accent" size="sm" onClick={() => handleMarkCompleted(a)} loading={completing === a.id}>✓ Mark Completed</Button>
                    )}
                    {a.status === 'completed' && (
                      <Button variant="primary" size="sm" onClick={() => navigate(`/admin/attendance/${a.id}`)}>📋 Attendance</Button>
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
        {activities.map(a => (
          <div key={a.id} className="manage-mobile-card">
            {a.coverImage && (
              <img src={a.coverImage} alt="" className="activity-mobile-thumb" />
            )}
            <span className="manage-member-name">{a.title}</span>
            <span className="manage-member-email">{formatDate(a.date)} · {a.location}</span>
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status]}</Badge>
              <div className="manage-actions">
                <Button variant="secondary" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(a)}>Delete</Button>
              </div>
            </div>
            {a.status === 'upcoming' && (
              <Button variant="accent" size="sm" style={{ marginTop: 'var(--space-sm)', width: '100%' }} onClick={() => handleMarkCompleted(a)} loading={completing === a.id}>✓ Mark as Completed</Button>
            )}
            {a.status === 'completed' && (
              <Button variant="primary" size="sm" style={{ marginTop: 'var(--space-sm)', width: '100%' }} onClick={() => navigate(`/admin/attendance/${a.id}`)}>📋 Manage Attendance</Button>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Activity' : 'Create Activity'} size="lg">
        {error && <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>⚠️ {error}</div>}
        <FormField label="Title" name="title" value={form.title} onChange={handleChange} required />
        <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} required rows={4} />
        <div className="form-row">
          <FormField label="Date" name="date" type="date" value={form.date} onChange={handleChange} required />
          <FormField label="Time" name="time" value={form.time} onChange={handleChange} required placeholder="e.g. 4:00 PM" />
        </div>
        <FormField label="Location" name="location" value={form.location} onChange={handleChange} required />
        <div className="form-row">
          <FormField label="Status" name="status" type="select" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
          <FormField label="Category" name="category" type="select" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
        </div>

        {/* Cover Image — Upload from device OR URL */}
        <div className="form-field">
          <label className="form-label">Cover Image</label>
          <ImageUpload
            currentImage={form.coverImage || null}
            onImageChange={handleCoverImageChange}
            uploadType="activity"
            activityId={editingId}
            showUrlOption={true}
            shape="rectangle"
            placeholder="🖼️"
          />
        </div>

        <div className="profile-edit-actions">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editingId ? 'Save Changes' : 'Create Activity'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}

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
import Icon from '../../components/common/Icon';
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
    <div className="container manage-activities-page">
      <div className="page-header manage-activities-header">
        <div>
          <div className="page-header-badge">
            <Icon name="calendar" size={14} /> Activity Registry
          </div>
          <h1 className="editorial-title">Manage Activities</h1>
          <p className="page-subtitle">Schedule upcoming events, record policy forums, and archive club sessions.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Icon name="plus" size={16} /> Create Activity
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="manage-table-wrapper card-surface">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Event Title & Venue</th>
              <th>Date</th>
              <th>Status</th>
              <th>Classification</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="activity-cell">
                    {a.coverImage ? (
                      <img src={a.coverImage} alt="" className="activity-cell__thumb" />
                    ) : (
                      <div className="activity-cell__thumb-placeholder">
                        <Icon name="calendar" size={16} />
                      </div>
                    )}
                    <div>
                      <span className="manage-member-name">{a.title}</span>
                      <span className="manage-member-email">
                        {a.location ? (
                          <><Icon name="map-pin" size={11} /> {a.location}</>
                        ) : 'Campus Location TBD'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="nowrap">
                  <span className="activity-table-date">{formatDate(a.date)}</span>
                  {a.time && <span className="activity-table-time">{a.time}</span>}
                </td>
                <td><Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status]}</Badge></td>
                <td><span className="activity-category-pill">{a.category || 'Other'}</span></td>
                <td>
                  <div className="manage-actions" style={{ justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                      <Icon name="edit" size={14} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(a)} className="text-danger">
                      <Icon name="trash" size={14} /> Delete
                    </Button>
                    {a.status === 'upcoming' && (
                      <Button variant="accent" size="sm" onClick={() => handleMarkCompleted(a)} loading={completing === a.id}>
                        <Icon name="check-circle" size={14} /> Complete
                      </Button>
                    )}
                    {a.status === 'completed' && (
                      <Button variant="primary" size="sm" onClick={() => navigate(`/admin/attendance/${a.id}`)}>
                        <Icon name="check-circle" size={14} /> Attendance
                      </Button>
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
          <div key={a.id} className="manage-mobile-card card-surface">
            {a.coverImage && (
              <img src={a.coverImage} alt="" className="activity-mobile-thumb" />
            )}
            <span className="manage-member-name">{a.title}</span>
            <span className="manage-member-email">{formatDate(a.date)} · {a.location}</span>
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={getStatusColor(a.status)} size="sm">{statusLabels[a.status]}</Badge>
              <div className="manage-actions">
                <Button variant="secondary" size="sm" onClick={() => openEdit(a)}>
                  <Icon name="edit" size={14} /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(a)}>
                  <Icon name="trash" size={14} /> Delete
                </Button>
              </div>
            </div>
            {a.status === 'upcoming' && (
              <Button variant="accent" size="sm" style={{ marginTop: 'var(--space-sm)', width: '100%' }} onClick={() => handleMarkCompleted(a)} loading={completing === a.id}>
                <Icon name="check-circle" size={14} /> Mark as Completed
              </Button>
            )}
            {a.status === 'completed' && (
              <Button variant="primary" size="sm" style={{ marginTop: 'var(--space-sm)', width: '100%' }} onClick={() => navigate(`/admin/attendance/${a.id}`)}>
                <Icon name="check-circle" size={14} /> Manage Attendance
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Activity Details' : 'Create New Activity'} size="lg">
        {error && (
          <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>
            <Icon name="alert-circle" size={16} /> {error}
          </div>
        )}
        <FormField label="Activity Title" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. National Budget Analysis Roundtable" />
        <FormField label="Overview & Synopsis" name="description" type="textarea" value={form.description} onChange={handleChange} required rows={4} placeholder="Comprehensive description of the activity agenda and outcomes..." />
        <div className="form-row">
          <FormField label="Event Date" name="date" type="date" value={form.date} onChange={handleChange} required />
          <FormField label="Session Time" name="time" value={form.time} onChange={handleChange} required placeholder="e.g. 4:00 PM – 6:00 PM" />
        </div>
        <FormField label="Venue Location" name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Seminar Hall 3 / Virtual Link" />
        <div className="form-row">
          <FormField label="Status" name="status" type="select" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} />
          <FormField label="Activity Category" name="category" type="select" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
        </div>

        {/* Cover Image — Upload from device OR URL */}
        <div className="form-field" style={{ marginTop: 'var(--space-sm)' }}>
          <label className="form-label">Cover Photograph</label>
          <ImageUpload
            currentImage={form.coverImage || null}
            onImageChange={handleCoverImageChange}
            uploadType="activity"
            activityId={editingId}
            showUrlOption={true}
            shape="rectangle"
          />
        </div>

        <div className="profile-edit-actions">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editingId ? 'Save Changes' : 'Publish Activity'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated attendance records will be removed.`}
        confirmText="Delete Activity"
        loading={deleting}
      />
    </div>
  );
}

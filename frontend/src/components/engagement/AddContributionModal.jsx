import { useState, useEffect } from 'react';
import { contributionService } from '../../services/contributionService';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import Button from '../common/Button';
import Icon from '../common/Icon';
import './AddContributionModal.css';

const CATEGORY_OPTIONS = [
  { value: 'TASK', label: 'Task Execution' },
  { value: 'RESOURCE', label: 'Research & Written Resource' },
  { value: 'EVENT_SUPPORT', label: 'Event Support & Logistics' },
  { value: 'EVENT_ORGANIZED', label: 'Event Leadership & Organization' },
  { value: 'MAJOR_RESPONSIBILITY', label: 'Major Institutional Initiative' },
];

export default function AddContributionModal({
  isOpen,
  onClose,
  onSuccess,
  members = [],
  editingContribution = null,
  preselectedMemberId = null,
}) {
  const [types, setTypes] = useState({});
  const [form, setForm] = useState({
    memberId: '', category: '', contributionType: '', title: '',
    description: '', date: '', attachmentUrl: '', externalLink: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load contribution type definitions
  useEffect(() => {
    if (isOpen) {
      contributionService.getTypes()
        .then(data => setTypes(data.types || {}))
        .catch(() => {});
    }
  }, [isOpen]);

  // Pre-fill form when editing or when member is preselected
  useEffect(() => {
    if (editingContribution) {
      setForm({
        memberId: editingContribution.memberId,
        category: editingContribution.category,
        contributionType: editingContribution.contributionType,
        title: editingContribution.title,
        description: editingContribution.description,
        date: editingContribution.date,
        attachmentUrl: editingContribution.attachmentUrl || '',
        externalLink: editingContribution.externalLink || '',
      });
    } else {
      setForm({
        memberId: preselectedMemberId || '',
        category: '', contributionType: '', title: '',
        description: '', date: '', attachmentUrl: '', externalLink: '',
      });
    }
    setError('');
  }, [editingContribution, preselectedMemberId, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Reset contribution type when category changes
      if (name === 'category') {
        next.contributionType = '';
      }
      return next;
    });
  };

  // Get type options based on selected category
  const typeOptions = Object.entries(types)
    .filter(([, def]) => def.category === form.category)
    .map(([key, def]) => ({
      value: key,
      label: `${def.label} (${def.points} pts)`,
    }));

  // Get auto-calculated points
  const selectedType = types[form.contributionType];
  const autoPoints = selectedType?.points || null;

  const handleSave = async () => {
    if (!form.memberId || !form.contributionType || !form.title || !form.description || !form.date) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingContribution) {
        await contributionService.update(editingContribution.id, form);
      } else {
        await contributionService.create(form);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save contribution');
    } finally {
      setSaving(false);
    }
  };

  const memberOptions = members.map(m => ({
    value: m.id,
    label: m.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingContribution ? 'Edit Contribution Record' : 'Record Member Contribution'}
      size="lg"
    >
      {error && (
        <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>
          <Icon name="alert-circle" size={16} /> {error}
        </div>
      )}

      <FormField
        label="Member"
        name="memberId"
        type="select"
        value={form.memberId}
        onChange={handleChange}
        options={memberOptions}
        placeholder="Select enrolled member..."
        required
        disabled={!!editingContribution || !!preselectedMemberId}
      />

      <FormField
        label="Contribution Category"
        name="category"
        type="select"
        value={form.category}
        onChange={handleChange}
        options={CATEGORY_OPTIONS}
        placeholder="Select policy / club category..."
        required
      />

      {form.category && (
        <FormField
          label="Specific Contribution Type"
          name="contributionType"
          type="select"
          value={form.contributionType}
          onChange={handleChange}
          options={typeOptions}
          placeholder="Select verified type..."
          required
        />
      )}

      {autoPoints !== null && (
        <div className="contribution-points-display">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="award" size={18} />
            <span className="contribution-points-label">Merit Points (Auto-assigned)</span>
          </div>
          <span className="contribution-points-value">+{autoPoints} pts</span>
        </div>
      )}

      <FormField
        label="Title / Brief Headline"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="e.g. Authored Policy Brief on Renewable Energy Subsidies"
        required
      />

      <FormField
        label="Detailed Description & Evidence"
        name="description"
        type="textarea"
        value={form.description}
        onChange={handleChange}
        placeholder="Provide specifics on the member's deliverable and impact..."
        required
        rows={3}
      />

      <FormField
        label="Date of Completion"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        required
      />

      <FormField
        label="External Reference Link (optional)"
        name="externalLink"
        value={form.externalLink}
        onChange={handleChange}
        placeholder="https://..."
      />

      <div className="profile-edit-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          {editingContribution ? 'Save Changes' : 'Log Contribution'}
        </Button>
      </div>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { engagementService } from '../../services/engagementService';
import { getInitials, getPositionLabel } from '../../utils/helpers';
import PositionBadge from '../../components/member/PositionBadge';
import ImageUpload from '../../components/common/ImageUpload';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import Modal from '../../components/common/Modal';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', course: '', year: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [engagement, setEngagement] = useState(null);

  useEffect(() => {
    if (user?.id) {
      engagementService.getMyEngagement()
        .then(data => setEngagement(data))
        .catch(err => console.error('Failed to load engagement summary:', err));
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        course: user.course || '',
        year: user.year || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await profileService.update(form);
      updateUser(updated);
      setEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await profileService.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPasswordModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Profile photo change — auto-persisted via imageService
  const handleProfileImageChange = async (newUrl) => {
    try {
      // If newUrl is null, the ImageUpload component already called removeProfileImage
      // If newUrl is a URL, the ImageUpload component already uploaded and got the URL
      // We just need to update the local user state
      const updated = await profileService.update({ profileImage: newUrl });
      updateUser(updated);
      setMessage(newUrl ? 'Profile photo updated!' : 'Profile photo removed.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      // If the upload already saved, the image is still there —
      // just refresh user data to sync
      console.error('Failed to sync profile image:', err);
    }
  };

  if (!user) return null;

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your account information</p>
      </div>

      {message && <div className="profile-success">{message}</div>}
      {error && !passwordModal && <div className="profile-error">⚠️ {error}</div>}

      <div className="profile-card animate-fade-in">
        <div className="profile-card__header">
          {/* Profile Photo Upload */}
          <div className="profile-photo-section">
            <ImageUpload
              currentImage={user.profileImage}
              onImageChange={handleProfileImageChange}
              uploadType="profile"
              shape="circle"
              placeholder={getInitials(user.name)}
            />
          </div>
          <div className="profile-card__identity">
            <h2>{user.name}</h2>
            <PositionBadge position={user.position} role={user.role} size="md" />
            <p className="profile-card__email">{user.email}</p>
          </div>
        </div>

        <div className="profile-card__body">
          {editing ? (
            <div className="profile-edit-form">
              <FormField label="Name" name="name" value={form.name} onChange={handleChange} required />
              <FormField label="Course" name="course" value={form.course} onChange={handleChange} placeholder="e.g. B.A. Political Science" />
              <FormField label="Year" name="year" value={form.year} onChange={handleChange} placeholder="e.g. 3rd Year" />
              <FormField label="Bio" name="bio" type="textarea" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={3} />

              {/* Show position as read-only */}
              <div className="profile-readonly-field">
                <span className="form-label">Position</span>
                <span className="profile-readonly-value">
                  <PositionBadge position={user.position} role={user.role} size="sm" />
                  <span className="profile-readonly-hint">(Cannot be changed here)</span>
                </span>
              </div>

              <div className="profile-edit-actions">
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <div className="profile-detail-row">
                <span className="profile-detail-label">Email</span>
                <span className="profile-detail-value">{user.email}</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Position</span>
                <span className="profile-detail-value">{getPositionLabel(user.position, user.role)}</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Role</span>
                <span className="profile-detail-value" style={{ textTransform: 'capitalize' }}>{user.role === 'teacher_admin' ? 'Teacher / Super Admin' : 'Student'}</span>
              </div>
              {user.course && (
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Course</span>
                  <span className="profile-detail-value">{user.course}</span>
                </div>
              )}
              {user.year && (
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Year</span>
                  <span className="profile-detail-value">{user.year}</span>
                </div>
              )}
              {user.bio && (
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Bio</span>
                  <span className="profile-detail-value">{user.bio}</span>
                </div>
              )}
              
              {engagement && (
                <>
                  <div style={{ marginTop: 'var(--space-xl)', marginBottom: 'var(--space-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', margin: 0 }}>Engagement Summary</h3>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Activity Level</span>
                    <span className="profile-detail-value">
                      <span className={`status-badge status-badge--${engagement.activityLevel === 'Excellent' || engagement.activityLevel === 'Good' ? 'success' : 'warning'}`}>
                        {engagement.activityLevel}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-sm)' }}>
                        {engagement.attendance.percentage}% attendance
                      </span>
                    </span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Contribution</span>
                    <span className="profile-detail-value">
                      <span className={`status-badge status-badge--${engagement.contributionLevel === 'High' || engagement.contributionLevel === 'Moderate' ? 'success' : 'warning'}`}>
                        {engagement.contributionLevel}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-sm)' }}>
                        {engagement.contribution.totalPoints} points
                      </span>
                    </span>
                  </div>
                </>
              )}

              <div className="profile-actions">
                <Button variant="primary" onClick={() => setEditing(true)}>Edit Profile</Button>
                <Button variant="secondary" onClick={() => setPasswordModal(true)}>Change Password</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal isOpen={passwordModal} onClose={() => { setPasswordModal(false); setError(''); }} title="Change Password" size="sm">
        {error && passwordModal && <div className="profile-error" style={{ marginBottom: 'var(--space-lg)' }}>⚠️ {error}</div>}
        <FormField label="Current Password" name="currentPassword" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
        <FormField label="New Password" name="newPassword" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
        <FormField label="Confirm New Password" name="confirmPassword" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
        <div className="profile-edit-actions">
          <Button variant="secondary" onClick={() => { setPasswordModal(false); setError(''); }}>Cancel</Button>
          <Button variant="primary" onClick={handlePasswordChange} loading={saving}>Change Password</Button>
        </div>
      </Modal>
    </div>
  );
}

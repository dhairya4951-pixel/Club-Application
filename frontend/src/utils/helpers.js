/**
 * Frontend Utility Helpers
 */

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date for display in short form
 */
export function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time for chat messages
 */
export function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(dateString);
}

/**
 * Get position label
 */
export function getPositionLabel(position, role) {
  // Teacher/Super Admin label
  if (role === 'teacher_admin') return 'Teacher / Super Admin';
  const labels = {
    president: 'President',
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    none: 'Member',
  };
  return labels[position] || 'Member';
}

/**
 * Get user initials for avatar
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get status badge color class
 */
export function getStatusColor(status) {
  switch (status) {
    case 'upcoming': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    case 'present': return 'success';
    case 'absent': return 'error';
    default: return 'muted';
  }
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

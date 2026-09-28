/**
 * Indian Standard Time (IST, UTC+05:30) Date Utilities
 * Ensures consistent Asia/Kolkata time formatting across NewsAxis.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a Date or ISO string into a human-readable Indian Standard Time string.
 * Example: "28 Sep 2026, 09:30:15 AM IST"
 */
export function formatIST(date = new Date()) {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d) + ' IST';
  } catch {
    return '';
  }
}

/**
 * Formats date into a short time-only IST string.
 * Example: "09:30 AM IST"
 */
export function formatISTTime(date = new Date()) {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d) + ' IST';
  } catch {
    return '';
  }
}

/**
 * Formats date into short date + time IST string without seconds.
 * Example: "28 Sep, 09:30 AM IST"
 */
export function formatISTShort(date = new Date()) {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d) + ' IST';
  } catch {
    return '';
  }
}

/**
 * Calculates human relative time ago string.
 * Example: "Just now", "5m ago", "2h ago", "1d ago"
 */
export function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

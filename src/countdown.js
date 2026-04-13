/**
 * src/countdown.js — Pure calculation logic for countdown/countup display.
 * No DOM dependencies; fully testable with Node --test.
 */

/**
 * Returns calendar-day difference between two Date objects.
 * Strips time portion (uses local date only).
 * @param {Date} from
 * @param {Date} to
 * @returns {number} integer days (positive if to > from)
 */
export function getDaysBetween(from, to) {
  const msPerDay = 86_400_000;
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay   = Date.UTC(to.getFullYear(),   to.getMonth(),   to.getDate());
  return Math.round((toDay - fromDay) / msPerDay);
}

/**
 * Returns remaining (or elapsed) time from now to target date.
 * @param {Date} target
 * @param {Date} [now=new Date()]
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, total: number, isPast: boolean }}
 */
export function getTimeUntil(target, now = new Date()) {
  const diff = target.getTime() - now.getTime();
  const isPast = diff < 0;
  const abs = Math.abs(diff);

  const totalSeconds = Math.floor(abs / 1000);
  const seconds      = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes      = totalMinutes % 60;
  const totalHours   = Math.floor(totalMinutes / 60);
  const hours        = totalHours % 24;
  const days         = Math.floor(totalHours / 24);

  return { days, hours, minutes, seconds, total: diff, isPast };
}

/**
 * Formats a getTimeUntil result into a human-readable string (Japanese).
 * @param {{ days: number, hours: number, minutes: number, seconds: number }} time
 * @param {'ja'|'en'} [lang='ja']
 * @returns {string}
 */
export function formatDuration(time, lang = 'ja') {
  const { days, hours, minutes, seconds } = time;
  if (lang === 'en') {
    const parts = [];
    if (days    > 0) parts.push(`${days}d`);
    if (hours   > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds >= 0 && days === 0) parts.push(`${seconds}s`);
    return parts.length ? parts.join(' ') : '0s';
  }
  // Japanese default
  const parts = [];
  if (days    > 0) parts.push(`${days}日`);
  if (hours   > 0) parts.push(`${hours}時間`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (seconds >= 0 && days === 0) parts.push(`${seconds}秒`);
  return parts.length ? parts.join(' ') : '0秒';
}

/**
 * Returns true when two Dates fall on the same calendar day (local time).
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Creates a validated event object (does NOT persist; use storage layer).
 * @param {string} name
 * @param {string} date  ISO 8601 date string (YYYY-MM-DD)
 * @param {string} [color='#4f8ef7']
 * @param {string} [icon='🗓️']
 * @returns {{ id: string, name: string, date: string, color: string, icon: string, createdAt: string }}
 */
export function createEvent(name, date, color = '#4f8ef7', icon = '🗓️') {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    date,
    color,
    icon,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validates an event object and returns an error list.
 * @param {{ name: string, date: string }} event
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object') {
    return { valid: false, errors: ['Event must be an object'] };
  }

  const name = (event.name || '').trim();
  if (!name) {
    errors.push('Name is required');
  } else if (name.length > 100) {
    errors.push('Name must be 100 characters or fewer');
  }

  const dateStr = event.date || '';
  if (!dateStr) {
    errors.push('Date is required');
  } else {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      errors.push('Date is invalid');
    }
  }

  return { valid: errors.length === 0, errors };
}

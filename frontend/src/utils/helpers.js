import { riskClass, riskLabel } from './constants';

// ─── Number formatting ────────────────────────────────────────────────────────
export const fmt = {
  pct:   (n, decimals = 1) => `${Number(n).toFixed(decimals)}%`,
  num:   (n)               => Number(n).toLocaleString(),
  dec:   (n, decimals = 1) => Number(n).toFixed(decimals),
};

// ─── Risk helpers ─────────────────────────────────────────────────────────────
export { riskClass, riskLabel };

// ─── CSV download ─────────────────────────────────────────────────────────────
/**
 * Triggers a CSV file download from a 2D array.
 * @param {string[][]} rows  - Array of arrays (first row = headers)
 * @param {string} filename  - e.g. "attendance_report.csv"
 */
export function downloadCSV(rows, filename = 'export.csv') {
  const content = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function schoolYearFromDate(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

// ─── String helpers ───────────────────────────────────────────────────────────
export function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str = '', max = 30) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────
export function sortBy(arr, key, dir = 'asc') {
  return [...arr].sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Debounce ─────────────────────────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Clamp ────────────────────────────────────────────────────────────────────
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// ─── Role-based data scoping ──────────────────────────────────────────────────
/**
 * Given the current role and role-specific metadata, returns a dataScope
 * object that should be merged into API query params.
 */
export function buildDataScope(role, roleMeta = {}) {
  switch (role) {
    case 'school_admin':
      return { school: roleMeta.schoolId ?? 'all' };
    case 'teacher':
      return { school: roleMeta.schoolId ?? 'all', grade: roleMeta.grade ?? 'all' };
    case 'community_partner':
      return { aggregateOnly: true };
    default:
      return {};
  }
}

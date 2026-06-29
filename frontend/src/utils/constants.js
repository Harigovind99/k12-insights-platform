// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  DISTRICT_ADMIN:    'district_admin',
  SCHOOL_ADMIN:      'school_admin',
  TEACHER:           'teacher',
  COMMUNITY_PARTNER: 'community_partner',
  TRUANCY_OFFICER:   'truancy_officer',
};

export const ROLE_LABELS = {
  [ROLES.DISTRICT_ADMIN]:    'District Admin',
  [ROLES.SCHOOL_ADMIN]:      'School Admin',
  [ROLES.TEACHER]:           'Teacher',
  [ROLES.COMMUNITY_PARTNER]: 'Community Partner',
  [ROLES.TRUANCY_OFFICER]:   'Truancy Officer',
};

// Roles that can see student-level detail rows
export const STUDENT_LEVEL_ROLES = new Set([
  ROLES.DISTRICT_ADMIN,
  ROLES.SCHOOL_ADMIN,
  ROLES.TEACHER,
  ROLES.TRUANCY_OFFICER,
]);

// ─── Navigation items ─────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: 'home',          label: 'Dashboard Home',       path: '/',                       icon: 'LayoutDashboard' },
  { id: 'attendance',    label: 'Attendance',           path: '/insights/attendance',    icon: 'CalendarCheck' },
  { id: 'assessments',   label: 'Assessments',          path: '/insights/assessments',   icon: 'ClipboardList' },
  { id: 'truancy',       label: 'Truancy',              path: '/insights/truancy',       icon: 'AlertTriangle' },
  { id: 'students',      label: 'Students',             path: '/students',               icon: 'Users' },
  { id: 'early-warning', label: 'Early Warning',        path: '/insights/early-warning', icon: 'Siren',         phase: 2 },
  { id: 'behavior',      label: 'Behavior',             path: '/insights/behavior',      icon: 'ShieldAlert',   phase: 2 },
  { id: 'mtss',          label: 'MTSS',                 path: '/insights/mtss',          icon: 'Layers',        phase: 2 },
  { id: 'graduation',    label: 'Graduation',           path: '/insights/graduation',    icon: 'GraduationCap', phase: 2 },
  { id: 'schools',       label: 'Schools',              path: '/schools',                icon: 'School' },
  { id: 'schema',        label: 'Data Schema',          path: '/schema',                 icon: 'Database' },
];

// ─── Filter defaults ──────────────────────────────────────────────────────────
export const DEFAULT_FILTERS = {
  schoolYear:         '2024-2025',   // ← must match DASL SchoolYear VARCHAR exactly
  school:             'all',
  grade:              'all',
  group:              'all',
  absenceType:        'all',
  month:              'all',
  quarter:            'all',
  riskLevel:          'all',
  threshold:          10,
  interventionStatus: 'all',
  assessmentSubject:  'Math',
  search:             '',
};

// ─── Static filter option lists ───────────────────────────────────────────────

/**
 * School years — 4-digit format ('2024-2025') to match DASL SchoolYear VARCHAR.
 * Update when new years are added to the source system.
 */
export const SCHOOL_YEARS = ['2022-2023', '2023-2024', '2024-2025'];

/**
 * SCHOOLS_DEFAULT — minimal "All Schools" placeholder.
 * The full list is fetched at runtime by useSchools() and passed to FilterBar.
 */
export const SCHOOLS_DEFAULT = [{ id: 'all', name: 'All Schools' }];

/**
 * Backward-compat alias — some components may still import { SCHOOLS }.
 * Remove once all imports are migrated to useSchools().
 */
export const SCHOOLS = SCHOOLS_DEFAULT;

export const GRADES = ['all', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const STUDENT_GROUPS = [
  { id: 'all',      label: 'All Groups' },
  { id: 'el',       label: 'English Learners' },
  { id: 'sped',     label: 'Special Education' },
  { id: 'frl',      label: 'Free/Reduced Lunch' },
  { id: 'foster',   label: 'Foster Youth' },
  { id: 'homeless', label: 'Homeless/McKinney-Vento' },
];

export const ABSENCE_TYPES = [
  { id: 'all',        label: 'All Types' },
  { id: 'excused',    label: 'Excused' },
  { id: 'unexcused',  label: 'Unexcused' },
  { id: 'tardy',      label: 'Tardy' },
  { id: 'suspension', label: 'Suspension' },
];

export const MONTHS = [
  'all', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
];

export const QUARTERS = ['all', 'Q1', 'Q2', 'Q3', 'Q4'];

// ─── Ohio HB 410 Risk Levels — CORRECT severity order (least → most severe) ──
// On Track < Moderate < At Risk < Chronic
export const RISK_LEVELS = [
  { id: 'all',      label: 'All Levels' },
  { id: 'low',      label: 'On Track'   },   // < 2%
  { id: 'moderate', label: 'Moderate'   },   // 2% – <5%
  { id: 'at_risk',  label: 'At Risk'    },   // 5% – <10%
  { id: 'chronic',  label: 'Chronic'    },   // ≥ 10%
];

export const INTERVENTION_STATUSES = [
  { id: 'all',       label: 'All Statuses' },
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'none',      label: 'None' },
];

export const ASSESSMENT_SUBJECTS = ['Math', 'Reading', 'Science', 'ELA'];

// ─── Ohio HB 410 Risk classification helpers ──────────────────────────────────
//
//  Correct order (least → most severe):
//    On Track  < 2%
//    Moderate  2% – <5%
//    At Risk   5% – <10%
//    Chronic   ≥ 10%
//
//  NOTE: "Moderate" is LESS severe than "At Risk" — this is intentional per HB 410.

/** Absence rate (0–100) → CSS risk class */
export function riskClass(absenceRate) {
  if (absenceRate <  2)  return 'risk-low';       // On Track
  if (absenceRate <  5)  return 'risk-moderate';  // Moderate
  if (absenceRate < 10)  return 'risk-atrisk';    // At Risk
  return 'risk-chronic';                           // Chronic
}

/** Absence rate (0–100) → human-readable label */
export function riskLabel(absenceRate) {
  if (absenceRate <  2)  return 'On Track';
  if (absenceRate <  5)  return 'Moderate';
  if (absenceRate < 10)  return 'At Risk';
  return 'Chronic';
}

// ─── Chart colour palettes ────────────────────────────────────────────────────
export const CHART_COLORS = {
  low:      '#16a34a',   // On Track  — green
  moderate: '#d97706',   // Moderate  — amber
  atRisk:   '#ea580c',   // At Risk   — orange
  chronic:  '#dc2626',   // Chronic   — red
  brand:    '#2563eb',
  purple:   '#7c3aed',
  muted:    '#94a3b8',
};

export const MONTH_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
];

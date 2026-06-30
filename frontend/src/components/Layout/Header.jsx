import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ROLE_LABELS, NAV_ITEMS } from '@/utils/constants';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label }));

/* All 24 domain tabs — matching the HTML prototype exactly */
const DOMAIN_TABS = [
  { id: 'strategic-plan',      label: 'Strategic Plan',        path: null },
  { id: 'accountability',      label: 'Accountability',        path: null },
  { id: 'climate-culture',     label: 'Climate & Culture',     path: null },
  { id: 'school-improvement',  label: 'School Improvement',    path: null },
  { id: 'early-warning',       label: 'Early Warning',         path: null },
  { id: 'mtss-rti',            label: 'MTSS/RTI',              path: null },
  { id: 'whole-child',         label: 'Whole Child',           path: null },
  { id: 'well-being',          label: 'Well-being',            path: null },
  { id: 'assessments',         label: 'Assessments',           path: null },
  { id: 'academics',           label: 'Academics',             path: null },
  { id: 'attendance',          label: 'Attendance',            path: '/insights/attendance' },
  { id: 'behavior',            label: 'Behavior & Discipline', path: null },
  { id: 'graduation',          label: 'Graduation Readiness',  path: null },
  { id: 'college-career',      label: 'College Career Life',   path: null },
  { id: 'portrait-grad',       label: 'Portrait of a Graduate',path: null },
  { id: 'community',           label: 'Community Engagement',  path: null },
  { id: 'family',              label: 'Family Engagement',     path: null },
  { id: 'safety',              label: 'Safety',                path: null },
  { id: 'enrollment',          label: 'Enrollment',            path: null },
  { id: 'idea',                label: 'IDEA',                  path: null },
  { id: 'edtech',              label: 'EdTech Impact',         path: null },
  { id: 'finance',             label: 'Finance',               path: null },
  { id: 'staff',               label: 'Staff',                 path: null },
  { id: 'custom',              label: 'Custom',                path: null },
];

function buildBreadcrumb(pathname) {
  if (pathname === '/' || pathname === '') return { domain: null, sub: 'Dashboard' };
  const match = NAV_ITEMS.find(n => n.path !== '/' && pathname.startsWith(n.path));
  if (match) return { domain: 'Insights', sub: match.label };
  if (pathname.startsWith('/students')) return { domain: null, sub: 'Students' };
  if (pathname.startsWith('/schools'))  return { domain: null, sub: 'Schools' };
  if (pathname.startsWith('/schema'))   return { domain: null, sub: 'Data Schema' };
  return { domain: null, sub: 'Dashboard' };
}

export default function Header() {
  const { role, setRole, openSchemaModal } = useAppContext();
  const location  = useLocation();
  const navigate  = useNavigate();
  const { domain, sub } = buildBreadcrumb(location.pathname);

  const isInsights = location.pathname.startsWith('/insights');

  function handleTabClick(tab) {
    if (tab.path) navigate(tab.path);
  }

  function isTabActive(tab) {
    if (!tab.path) return false;
    return location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
  }

  return (
    <header
      className="bg-white border-b border-surface-border flex flex-col flex-shrink-0"
      style={{ zIndex: 40 }}
    >
      {/* Top bar (h-14 = 56px) */}
      <div className="flex items-center justify-between px-4" style={{ height: '56px' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-txt-muted">
          <span className="text-brand-500 font-medium">Insights</span>
          {domain && (
            <>
              <ChevronRight size={12} />
              <span>{domain}</span>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-txt-primary font-medium">{sub}</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="filter-select text-xs"
            style={{ minWidth: '140px' }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>

          <button
            onClick={openSchemaModal}
            className="text-xs text-brand-500 font-medium hover:underline px-2 py-1 rounded"
          >
            Schema &amp; Docs
          </button>

          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell size={16} className="text-txt-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100">
            <HelpCircle size={16} className="text-txt-muted" />
          </button>

          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
            HA
          </div>
        </div>
      </div>

      {/* Domain tab strip — always visible inside /insights, all 24 tabs */}
      {isInsights && (
        <div
          className="flex overflow-x-auto tab-scroll border-t border-surface-border px-2"
          style={{ flexShrink: 0 }}
        >
          {DOMAIN_TABS.map((tab) => {
            const active = isTabActive(tab);
            const hasRoute = !!tab.path;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={'domain-tab' + (active ? ' active' : '') + (!hasRoute ? ' opacity-50 cursor-not-allowed' : '')}
                title={hasRoute ? tab.label : `${tab.label} (coming soon)`}
                disabled={!hasRoute}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

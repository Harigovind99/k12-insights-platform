import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ROLE_LABELS, NAV_ITEMS } from '@/utils/constants';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label }));

/* Domain-level tabs that appear inside the Insights section — mirrors original */
const DOMAIN_TABS = [
  { id: 'attendance',    label: 'Attendance',   path: '/insights/attendance'    },
  { id: 'assessments',   label: 'Assessments',  path: '/insights/assessments'   },
  { id: 'truancy',       label: 'Truancy',      path: '/insights/truancy'       },
  { id: 'early-warning', label: 'Early Warning',path: '/insights/early-warning' },
  { id: 'behavior',      label: 'Behavior',     path: '/insights/behavior'      },
  { id: 'mtss',          label: 'MTSS',         path: '/insights/mtss'          },
  { id: 'graduation',    label: 'Graduation',   path: '/insights/graduation'    },
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
  const location = useLocation();
  const { domain, sub } = buildBreadcrumb(location.pathname);

  const isInsights = location.pathname.startsWith('/insights');

  return (
    <header
      className="bg-white border-b border-surface-border flex flex-col flex-shrink-0"
      style={{ zIndex: 40 }}
    >
      {/* ── Top bar (h-14 = 56px — exact original) ── */}
      <div className="flex items-center justify-between px-4" style={{ height: '56px' }}>

        {/* Breadcrumb — exact original style */}
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
          {/* Role switcher — exact original */}
          <select
            id="role-switcher"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="filter-select text-xs"
            style={{ minWidth: '140px' }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>

          {/* Schema & Docs link */}
          <button
            onClick={openSchemaModal}
            className="text-xs text-brand-500 font-medium hover:underline px-2 py-1 rounded"
          >
            Schema &amp; Docs
          </button>

          {/* Bell */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell size={16} className="text-txt-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <HelpCircle size={16} className="text-txt-muted" />
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
            HA
          </div>
        </div>
      </div>

      {/* ── Domain tab strip (only inside /insights) — exact original ── */}
      {isInsights && (
        <div
          className="flex overflow-x-auto tab-scroll border-t border-surface-border px-2"
          style={{ flexShrink: 0 }}
        >
          {DOMAIN_TABS.map((tab) => {
            const isActive = location.pathname === tab.path ||
              location.pathname.startsWith(tab.path + '/');
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={'domain-tab' + (isActive ? ' active' : '')}
              >
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}

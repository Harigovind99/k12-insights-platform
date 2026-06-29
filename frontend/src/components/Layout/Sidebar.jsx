import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, FileCheck, Users, GraduationCap, Crosshair, School,
  BookOpen, Lightbulb, FileText, ClipboardList, Shield,
  Handshake, CreditCard, LineChart, Settings, Activity,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { NAV_ITEMS } from '@/utils/constants';

/**
 * NAV_ITEMS from constants are the "Insights" sub-pages.
 * The sidebar also mirrors the original top-level nav items.
 */
const TOP_NAV = [
  { id: 'home',        label: 'Home',        path: '/',                       icon: Home },
  { id: 'assessments', label: 'Assessments', path: '/insights/assessments',   icon: FileCheck },
  { id: 'people',      label: 'People',      path: '/people',                 icon: Users },
  { id: 'students',    label: 'Students',    path: '/students',               icon: GraduationCap },
  { id: 'focus',       label: 'Focus',       path: '/focus',                  icon: Crosshair },
  { id: 'class',       label: 'Class',       path: '/class',                  icon: School },
  { id: 'curriculum',  label: 'Curriculum',  path: '/curriculum',             icon: BookOpen },
  { id: 'learn',       label: 'Learn',       path: '/learn',                  icon: Lightbulb },
  { id: 'forms',       label: 'Forms',       path: '/forms',                  icon: FileText },
  { id: 'plans',       label: 'Plans',       path: '/plans',                  icon: ClipboardList },
  { id: 'behavior',    label: 'Behavior',    path: '/behavior',               icon: Shield },
  { id: 'partners',    label: 'Partners',    path: '/partners',               icon: Handshake },
  { id: 'payments',    label: 'Payments',    path: '/payments',               icon: CreditCard },
  { id: 'insights',    label: 'Insights',    path: '/insights/attendance',    icon: LineChart },
  { id: 'settings',   label: 'Settings',    path: '/settings',               icon: Settings },
  { id: 'diagnostics', label: 'Diagnostics', path: '/diagnostics',           icon: Activity },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppContext();
  const location = useLocation();

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '56px' : '220px',
        minWidth: sidebarCollapsed ? '56px' : '220px',
        transition: 'width 0.2s, min-width 0.2s',
      }}
      className="flex flex-col h-full bg-navy text-white flex-shrink-0"
    >
      <div
        className="flex flex-col h-full"
        style={{ alignItems: sidebarCollapsed ? 'center' : 'stretch' }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10"
             style={{ minHeight: '56px' }}>
          <div className="w-8 h-8 rounded-sm bg-transparent flex items-center justify-center flex-shrink-0">
            {/* Show initials when no image available — matches original MVTCG branding */}
            <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
              MV
            </div>
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight">MVTCG</span>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav
          className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1"
          style={{ overflowX: 'hidden' }}
        >
          {TOP_NAV.map((item) => {
            const Icon = item.icon;
            // "active" = exact match for '/', startsWith for others
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive: navIsActive }) =>
                  'nav-item' +
                  ((item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path))
                    ? ' active'
                    : '')
                }
                style={sidebarCollapsed ? { justifyContent: 'center', padding: '10px' } : {}}
                onClick={(e) => {
                  // For placeholder pages, prevent navigation
                  const realPages = ['/', '/students', '/insights/attendance',
                    '/insights/assessments', '/insights/truancy', '/insights/early-warning',
                    '/insights/behavior', '/schools', '/schema'];
                  if (!realPages.some(p => item.path === p || item.path.startsWith('/insights'))) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Collapse toggle ── */}
        <div className="px-3 py-2 border-t border-white/10">
          <button
            onClick={toggleSidebar}
            className="nav-item w-full"
            style={sidebarCollapsed ? { justifyContent: 'center', padding: '10px' } : {}}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen size={16} className="flex-shrink-0" />
              : (
                <>
                  <PanelLeftClose size={16} className="flex-shrink-0" />
                  <span className="nav-label text-xs">Collapse</span>
                </>
              )
            }
          </button>
        </div>

        {/* ── User avatar — exact original ── */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            HA
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">Hari</div>
              <div className="text-[10px] text-txt-light">Admin</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

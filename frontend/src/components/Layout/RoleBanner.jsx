import React from 'react';
import { Info } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { ROLES } from '@/utils/constants';

const BANNER_CONFIG = {
  [ROLES.SCHOOL_ADMIN]: {
    bg: 'bg-brand-50 border-brand-200',
    text: 'text-brand-700',
    msg: 'School Admin view — data is scoped to your assigned school.',
  },
  [ROLES.TEACHER]: {
    bg: 'bg-purple-light border-purple-200',
    text: 'text-purple-dark',
    msg: 'Teacher view — data is scoped to your assigned grade and classroom.',
  },
  [ROLES.COMMUNITY_PARTNER]: {
    bg: 'bg-success-light border-green-200',
    text: 'text-success-dark',
    msg: 'Community Partner view — aggregate data only. Student-level detail is not shown.',
  },
  [ROLES.TRUANCY_OFFICER]: {
    bg: 'bg-warning-light border-warning-200',
    text: 'text-warning-dark',
    msg: 'Truancy Officer view — showing students who meet the current truancy threshold.',
  },
};

export default function RoleBanner() {
  const { role } = useAppContext();
  const config = BANNER_CONFIG[role];

  if (!config) return null; // District admin sees no banner

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 px-6 py-2 border-b text-sm font-medium ${config.bg} ${config.text}`}
    >
      <Info size={15} className="flex-shrink-0" />
      {config.msg}
    </div>
  );
}

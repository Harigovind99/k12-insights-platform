import React from 'react';
import { X, Phone, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { riskClass, riskLabel, fmt } from '@/utils/helpers';

/**
 * StudentProfilePanel — slide-in side panel for quick profile view.
 * Used by TruancyDashboard and other list views.
 * Props:
 *   student   object | null
 *   contacts  object[]
 *   onClose   () => void
 */
export default function StudentProfilePanel({ student, contacts = [], onClose }) {
  if (!student) return null;

  const absRate = student.absence_rate ?? 0;

  return (
    <div
      role="dialog"
      aria-label="Student profile"
      aria-modal="true"
      className="w-80 flex-shrink-0 bg-surface-card rounded-xl border border-surface-border
                 overflow-y-auto custom-scroll animate-fade-in flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-surface-border">
        <div>
          <p className="font-semibold text-txt-primary text-sm">
            {student.name ?? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()}
          </p>
          <p className="text-xs text-txt-muted mt-0.5">
            {student.school_name ?? student.school} · Grade {student.grade}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-1 text-txt-muted hover:text-txt-primary hover:bg-surface-bg rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Risk badge */}
      <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
        <span className={clsx('risk-pill text-xs', riskClass(absRate))}>
          {riskLabel(absRate)}
        </span>
        <span className="text-xl font-bold text-txt-primary">{fmt.pct(absRate)}</span>
      </div>

      {/* Detail fields */}
      <div className="p-5 space-y-2 text-sm border-b border-surface-border">
        {[
          ['Student ID',   student.student_id],
          ['Counselor',    student.counselor ?? '—'],
          ['EL Status',    student.el_status ? 'Yes' : 'No'],
          ['SPED',         student.sped_status ? 'Yes' : 'No'],
          ['FRL',          student.free_reduced_lunch ? 'Yes' : 'No'],
          ['Intervention', student.intervention_status ?? 'None'],
          ['Last Contact', student.last_contact_date ?? '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-txt-muted whitespace-nowrap">{k}</span>
            <span className="font-medium text-txt-primary text-right truncate">{v}</span>
          </div>
        ))}
      </div>

      {/* Contacts */}
      {contacts.length > 0 && (
        <div className="p-5 space-y-3 border-b border-surface-border">
          <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Parent / Guardian</p>
          {contacts.map((c, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-medium text-txt-primary">{c.name} <span className="text-txt-light font-normal">({c.relationship})</span></p>
              {c.phone && (
                <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
                  <Phone size={11} /> {c.phone}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
                  <Mail size={11} /> {c.email}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="p-4 space-y-2 mt-auto">
        <Link
          to={`/students/${student.student_id}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-medium
                     border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
        >
          <ExternalLink size={13} />
          Full Profile
        </Link>
      </div>
    </div>
  );
}

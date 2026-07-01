import React from 'react';
import { RotateCcw, Download } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useSchools } from '@/hooks/useSchools';
import {
  GRADES, STUDENT_GROUPS, ABSENCE_TYPES,
  MONTHS, QUARTERS, RISK_LEVELS, SCHOOL_YEARS,
  INTERVENTION_STATUSES, ASSESSMENT_SUBJECTS,
} from '@/utils/constants';
import { downloadCSV } from '@/utils/helpers';

const MONTH_FULL = {
  all: 'All Months',
  Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
};

/**
 * FilterBar — sticky row with label-above-select style matching the original prototype.
 * Props:
 *   show         string[]  – which filter keys to render; empty = all
 *   data         any       – passed to CSV export
 *   csvFilename  string
 *   loading      bool      – shows animated dots while data is loading
 */
export default function FilterBar({ show = [], data, csvFilename = 'export.csv', loading = false }) {
  const f = useFilters();
  const { schools } = useSchools();

  const visible = (key) => show.length === 0 || show.includes(key);

  function LabeledSelect({ label, value, onChange, children, className = '', title }) {
    return (
      <div className="flex flex-col gap-0.5 shrink-0">
        <span className="text-xs text-txt-muted font-medium px-0.5">{label}</span>
        <select value={value} onChange={onChange} className={`filter-select ${className}`} title={title}>
          {children}
        </select>
      </div>
    );
  }

  return (
    <div
      className="sticky top-0 z-30 bg-surface-card border-b border-surface-border
                 px-6 py-3 flex flex-wrap items-end gap-3 shadow-sm"
    >
      {visible('schoolYear') && (
        <LabeledSelect label="School Year" value={f.filters.schoolYear} onChange={(e) => f.setSchoolYear(e.target.value)}>
          {SCHOOL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </LabeledSelect>
      )}

      {visible('school') && (
        <LabeledSelect
          label="School"
          value={f.filters.school}
          onChange={(e) => f.setSchool(e.target.value)}
          className="max-w-[200px] truncate"
          title={schools.find((s) => s.id === f.filters.school)?.name}
        >
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </LabeledSelect>
      )}

      {visible('grade') && (
        <LabeledSelect label="Grade" value={f.filters.grade} onChange={(e) => f.setGrade(e.target.value)}>
          {GRADES.map((g) => <option key={g} value={g}>{g === 'all' ? 'All Grades' : `Grade ${g}`}</option>)}
        </LabeledSelect>
      )}

      {visible('group') && (
        <LabeledSelect label="Student Group" value={f.filters.group} onChange={(e) => f.setGroup(e.target.value)}>
          {STUDENT_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </LabeledSelect>
      )}

      {visible('absenceType') && (
        <LabeledSelect label="Absence Type" value={f.filters.absenceType} onChange={(e) => f.setAbsenceType(e.target.value)}>
          {ABSENCE_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </LabeledSelect>
      )}

      {visible('month') && (
        <LabeledSelect label="Month" value={f.filters.month} onChange={(e) => f.setMonth(e.target.value)}>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{MONTH_FULL[m] ?? m}</option>
          ))}
        </LabeledSelect>
      )}

      {visible('quarter') && (
        <LabeledSelect label="Quarter" value={f.filters.quarter} onChange={(e) => f.setQuarter(e.target.value)}>
          {QUARTERS.map((q) => <option key={q} value={q}>{q === 'all' ? 'All Quarters' : q}</option>)}
        </LabeledSelect>
      )}

      {visible('riskLevel') && (
        <LabeledSelect label="Risk Level" value={f.filters.riskLevel} onChange={(e) => f.setRiskLevel(e.target.value)}>
          {RISK_LEVELS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </LabeledSelect>
      )}

      {visible('interventionStatus') && (
        <LabeledSelect label="Intervention" value={f.filters.interventionStatus} onChange={(e) => f.setInterventionStatus(e.target.value)}>
          {INTERVENTION_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </LabeledSelect>
      )}

      {visible('assessmentSubject') && (
        <LabeledSelect label="Subject" value={f.filters.assessmentSubject} onChange={(e) => f.setAssessmentSubject(e.target.value)}>
          {ASSESSMENT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </LabeledSelect>
      )}

      {visible('search') && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-txt-muted font-medium px-0.5">Search</span>
          <input
            type="search"
            value={f.filters.search}
            onChange={(e) => f.setSearch(e.target.value)}
            placeholder="Search students…"
            className="filter-select pl-3 w-44"
          />
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-end gap-0.5 pb-2">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-end gap-2 pb-0">
        {f.isDirty && (
          <button
            onClick={f.resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-txt-muted
                       border border-surface-border rounded-lg hover:border-danger
                       hover:text-danger transition-colors"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
        <button
          onClick={() => data && downloadCSV(data, csvFilename)}
          disabled={!data}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     bg-brand-600 text-white rounded-lg hover:bg-brand-700
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={13} />
          Download CSV
        </button>
      </div>
    </div>
  );
}

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

/**
 * FilterBar — configurable filter row.
 * Props:
 *   show         string[]  - which filter keys to display (empty = show all)
 *   data         any       - data to export via CSV (optional)
 *   csvFilename  string    - filename for CSV export
 */
export default function FilterBar({ show = [], data, csvFilename = 'export.csv' }) {
  const f = useFilters();
  const { schools } = useSchools();   // fetched from /api/schools — live DASL list

  const visible = (key) => show.length === 0 || show.includes(key);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">

      {/* School Year */}
      {visible('schoolYear') && (
        <select
          value={f.filters.schoolYear}
          onChange={(e) => f.setSchoolYear(e.target.value)}
          className="filter-select"
        >
          {SCHOOL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      )}

      {/* School — populated from live API */}
      {visible('school') && (
        <select
          value={f.filters.school}
          onChange={(e) => f.setSchool(e.target.value)}
          className="filter-select"
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {/* Grade */}
      {visible('grade') && (
        <select
          value={f.filters.grade}
          onChange={(e) => f.setGrade(e.target.value)}
          className="filter-select"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>{g === 'all' ? 'All Grades' : `Grade ${g}`}</option>
          ))}
        </select>
      )}

      {/* Student Group */}
      {visible('group') && (
        <select
          value={f.filters.group}
          onChange={(e) => f.setGroup(e.target.value)}
          className="filter-select"
        >
          {STUDENT_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
      )}

      {/* Absence Type */}
      {visible('absenceType') && (
        <select
          value={f.filters.absenceType}
          onChange={(e) => f.setAbsenceType(e.target.value)}
          className="filter-select"
        >
          {ABSENCE_TYPES.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      )}

      {/* Month */}
      {visible('month') && (
        <select
          value={f.filters.month}
          onChange={(e) => f.setMonth(e.target.value)}
          className="filter-select"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m === 'all' ? 'All Months' : m}</option>
          ))}
        </select>
      )}

      {/* Quarter */}
      {visible('quarter') && (
        <select
          value={f.filters.quarter}
          onChange={(e) => f.setQuarter(e.target.value)}
          className="filter-select"
        >
          {QUARTERS.map((q) => (
            <option key={q} value={q}>{q === 'all' ? 'All Quarters' : q}</option>
          ))}
        </select>
      )}

      {/* Risk Level */}
      {visible('riskLevel') && (
        <select
          value={f.filters.riskLevel}
          onChange={(e) => f.setRiskLevel(e.target.value)}
          className="filter-select"
        >
          {RISK_LEVELS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      )}

      {/* Intervention Status */}
      {visible('interventionStatus') && (
        <select
          value={f.filters.interventionStatus}
          onChange={(e) => f.setInterventionStatus(e.target.value)}
          className="filter-select"
        >
          {INTERVENTION_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      )}

      {/* Assessment Subject */}
      {visible('assessmentSubject') && (
        <select
          value={f.filters.assessmentSubject}
          onChange={(e) => f.setAssessmentSubject(e.target.value)}
          className="filter-select"
        >
          {ASSESSMENT_SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {/* Search */}
      {visible('search') && (
        <input
          type="search"
          value={f.filters.search}
          onChange={(e) => f.setSearch(e.target.value)}
          placeholder="Search students…"
          className="filter-select pl-3 w-44"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reset */}
      {f.isDirty && (
        <button
          onClick={f.resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-txt-muted hover:text-danger
                     border border-surface-border rounded-lg hover:border-danger transition-colors"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      )}

      {/* CSV Export */}
      {data && (
        <button
          onClick={() => downloadCSV(data, csvFilename)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      )}
    </div>
  );
}

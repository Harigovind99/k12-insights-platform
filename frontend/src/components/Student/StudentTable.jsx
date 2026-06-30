import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import clsx from 'clsx';
import FilterBar  from '@/components/Filters/FilterBar';
import { useStudents } from '@/hooks/useStudents';
import { useAppContext } from '@/contexts/AppContext';
import { riskClass, riskLabel, fmt } from '@/utils/helpers';
import { STUDENT_LEVEL_ROLES } from '@/utils/constants';

// SQL returns PascalCase field names directly from DASL
function studentName(s) {
  return `${s.FirstName ?? ''} ${s.LastName ?? ''}`.trim() || '—';
}

function buildCSVRows(students) {
  return [
    ['Student ID','Name','School','Grade','Days Absent','Absence %','Risk','Tardy'],
    ...students.map(s => [
      s.StudentNumber ?? s.StudentId,
      studentName(s),
      s.SchoolName ?? '—',
      s.GradeLevel ?? '—',
      s.AbsenceDays ?? 0,
      fmt.pct(s.AbsenceRate ?? 0),
      riskLabel(s.AbsenceRate ?? 0),
      s.NumberOfTimesTardy ?? 0,
    ]),
  ];
}

const SORT_COLS = [
  { key: 'LastName',    label: 'Student' },
  { key: 'SchoolName',  label: 'School' },
  { key: 'GradeLevel',  label: 'Grade' },
  { key: 'AbsenceDays', label: 'Days Absent' },
  { key: 'AbsenceRate', label: 'Absence %' },
  { key: 'Risk',        label: 'Risk Level' },
];

export default function StudentTable() {
  const { role } = useAppContext();
  const canViewDetail = STUDENT_LEVEL_ROLES.has(role);

  const { students, total, page, totalPages, loading, error,
          sortCol, sortDir, toggleSort, nextPage, prevPage } = useStudents();

  const count = students.length > 0 ? students.length : total;

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="text-txt-muted ml-1 opacity-40">↕</span>;
    return <span className="text-brand-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto animate-fade-in">

      {/* Sticky filter bar */}
      <FilterBar
        show={['schoolYear','school','grade','group','riskLevel','interventionStatus','search']}
        data={students.length ? buildCSVRows(students) : null}
        csvFilename="students.csv"
        loading={loading}
      />

      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Students</h1>
          <p className="text-sm text-txt-muted mt-0.5">
            {count.toLocaleString()} students matching current filters
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-surface-border sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide w-8">#</th>
                  {SORT_COLS.map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="text-left px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide cursor-pointer hover:text-txt-primary select-none whitespace-nowrap"
                    >
                      {label}<SortIcon col={key} />
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide">Tardy</th>
                  {canViewDetail && (
                    <th className="px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading ? (
                  <tr>
                    <td colSpan={SORT_COLS.length + 3} className="py-16 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={SORT_COLS.length + 3} className="py-16 text-center text-txt-muted text-sm">
                      No students match the current filters.
                    </td>
                  </tr>
                ) : students.map((s, idx) => {
                  const absRate = s.AbsenceRate ?? 0;
                  const maxDays = 180;
                  const pctBar  = Math.min(100, (absRate / 20) * 100);
                  const barColor = absRate >= 10 ? '#ef4444' : absRate >= 5 ? '#f97316' : absRate >= 2 ? '#f59e0b' : '#16a34a';
                  return (
                    <tr key={s.StudentId ?? idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-txt-muted text-xs">
                        {(page - 1) * 25 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-brand-600" />
                          </div>
                          <div>
                            <p className="font-medium text-txt-primary leading-tight">{studentName(s)}</p>
                            <p className="text-xs text-txt-muted">{s.StudentNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-txt-muted">{s.SchoolName ?? '—'}</td>
                      <td className="px-4 py-3 text-txt-muted">{s.GradeLevel ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-txt-primary">{s.AbsenceDays ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-txt-primary">{fmt.pct(absRate)}</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width:`${pctBar}%`, background: barColor }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('risk-pill', riskClass(absRate))}>
                          {riskLabel(absRate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-txt-muted">{s.NumberOfTimesTardy ?? 0}</td>
                      {canViewDetail && (
                        <td className="px-4 py-3">
                          <Link
                            to={`/students/${s.StudentId}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline whitespace-nowrap"
                          >
                            View Profile →
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && students.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border text-xs text-txt-muted bg-gray-50">
              <span>{count.toLocaleString()} students</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded border border-surface-border disabled:opacity-30 hover:bg-white transition-colors"
                >
                  ← Prev
                </button>
                <span className="font-medium px-1">Page {page} of {totalPages}</span>
                <button
                  onClick={nextPage}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded border border-surface-border disabled:opacity-30 hover:bg-white transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

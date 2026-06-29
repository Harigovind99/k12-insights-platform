import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import clsx from 'clsx';
import FilterBar  from '@/components/Filters/FilterBar';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useStudents } from '@/hooks/useStudents';
import { useAppContext } from '@/contexts/AppContext';
import { riskClass, riskLabel, fmt } from '@/utils/helpers';
import { STUDENT_LEVEL_ROLES } from '@/utils/constants';

const COLUMNS = [
  { key: 'name',               label: 'Student' },
  { key: 'school_name',        label: 'School' },
  { key: 'grade',              label: 'Grade' },
  { key: 'absence_rate',       label: 'Absence %' },
  { key: 'risk',               label: 'Risk' },
  { key: 'intervention_status',label: 'Intervention' },
];

export default function StudentTable() {
  const { role } = useAppContext();
  const canViewDetail = STUDENT_LEVEL_ROLES.has(role);

  const { students, total, page, totalPages, loading, error,
          sortCol, sortDir, toggleSort, nextPage, prevPage } = useStudents();

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="text-txt-light ml-1">↕</span>;
    return <span className="text-brand-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Students</h1>
        <p className="text-sm text-txt-muted mt-0.5">
          {total.toLocaleString()} students matching current filters
        </p>
      </div>

      <FilterBar
        show={['schoolYear', 'school', 'grade', 'group', 'riskLevel', 'interventionStatus', 'search']}
        data={students.length ? buildCSVRows(students) : null}
        csvFilename="students.csv"
      />

      {error && (
        <div className="rounded-xl bg-danger-light border border-red-200 p-4 text-danger-dark text-sm">
          {error}
        </div>
      )}

      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        {loading ? (
          <LoadingSpinner className="m-16" />
        ) : (
          <>
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-sm">
                <thead className="bg-surface-bg border-b border-surface-border">
                  <tr>
                    {COLUMNS.map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key)}
                        className="text-left px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide cursor-pointer hover:text-txt-primary select-none whitespace-nowrap"
                      >
                        {label}<SortIcon col={key} />
                      </th>
                    ))}
                    {canViewDetail && (
                      <th className="px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide" />
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length + 1} className="py-16 text-center text-txt-muted text-sm">
                        No students match the current filters.
                      </td>
                    </tr>
                  ) : students.map((s) => {
                    const absRate = s.absence_rate ?? 0;
                    return (
                      <tr key={s.student_id} className="hover:bg-surface-bg transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                              <User size={13} className="text-brand-600" />
                            </div>
                            <span className="font-medium text-txt-primary">
                              {s.name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-txt-muted">{s.school_name ?? s.school ?? '—'}</td>
                        <td className="px-4 py-3 text-txt-muted">{s.grade}</td>
                        <td className="px-4 py-3 font-semibold text-txt-primary">{fmt.pct(absRate)}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('risk-pill', riskClass(absRate))}>{riskLabel(absRate)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                            s.intervention_status === 'active'    ? 'bg-brand-100 text-brand-700' :
                            s.intervention_status === 'completed' ? 'bg-success-light text-success-dark' :
                            'bg-surface-bg text-txt-muted border border-surface-border'
                          )}>
                            {s.intervention_status ?? 'None'}
                          </span>
                        </td>
                        {canViewDetail && (
                          <td className="px-4 py-3">
                            <Link
                              to={`/students/${s.student_id}`}
                              className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border text-xs text-txt-muted bg-surface-bg">
              <span>{total.toLocaleString()} total</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={prevPage}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded border border-surface-border disabled:opacity-30 hover:bg-white transition-colors"
                >
                  ← Prev
                </button>
                <span className="font-medium">Page {page} of {totalPages}</span>
                <button
                  onClick={nextPage}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded border border-surface-border disabled:opacity-30 hover:bg-white transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function buildCSVRows(students) {
  return [
    ['Student ID', 'Name', 'School', 'Grade', 'Absence %', 'Risk', 'Intervention'],
    ...students.map((s) => [
      s.student_id,
      s.name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
      s.school_name ?? s.school ?? '',
      s.grade,
      fmt.pct(s.absence_rate ?? 0),
      riskLabel(s.absence_rate ?? 0),
      s.intervention_status ?? 'None',
    ]),
  ];
}

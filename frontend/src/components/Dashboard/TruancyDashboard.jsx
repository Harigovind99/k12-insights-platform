import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import clsx from 'clsx';
import FilterBar   from '@/components/Filters/FilterBar';
import KPICard     from '@/components/KPI/KPICard';
import { useAttendance } from '@/hooks/useAttendance';
import { useFilters }    from '@/hooks/useFilters';
import { riskClass, riskLabel, fmt } from '@/utils/helpers';

// truancy list comes from useAttendance().truancy — fields: StudentId, FirstName, LastName,
// GradeLevel, SchoolName, EMail, AbsenceDays, UnexcusedAbsenceDays, SchoolDays, AbsenceRate

function studentName(s) {
  return `${s.FirstName ?? ''} ${s.LastName ?? ''}`.trim() || '—';
}

export default function TruancyDashboard() {
  const { filters } = useFilters();
  const [selectedId, setSelectedId] = useState(null);
  const { truancy, loading } = useAttendance(filters);

  const selected = truancy.find(s => s.StudentId === selectedId);

  const noIntervention = truancy.filter(s => !s.InterventionStatus || s.InterventionStatus === 'none').length;
  const activeCases    = truancy.filter(s => s.InterventionStatus === 'active').length;

  function buildCSVRows() {
    return [
      ['Student','School','Grade','Absence Days','Unexcused Days','Absence Rate %'],
      ...truancy.map(s => [
        studentName(s),
        s.SchoolName ?? '—',
        s.GradeLevel ?? '—',
        s.AbsenceDays ?? 0,
        s.UnexcusedAbsenceDays ?? 0,
        fmt.pct(s.AbsenceRate ?? 0),
      ]),
    ];
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto animate-fade-in">

      {/* Sticky filter bar */}
      <FilterBar
        show={['schoolYear','school','grade','search']}
        data={truancy.length ? buildCSVRows() : null}
        csvFilename="truancy_report.csv"
        loading={loading}
      />

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-txt-primary">Truancy Officer Dashboard</h1>
            <p className="text-sm text-txt-muted mt-0.5">Students meeting truancy threshold — ready for letter generation</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            label="Total Qualifying"
            value={truancy.length}
            sub="≥ 10% absence rate"
            badge="Truancy"
            badgeColor="red"
            loading={loading}
          />
          <KPICard
            label="No Intervention"
            value={noIntervention}
            sub="needs follow-up"
            badge="Pending"
            badgeColor="yellow"
            loading={loading}
          />
          <KPICard
            label="Active Cases"
            value={activeCases}
            sub="under intervention"
            badge="Active"
            badgeColor="blue"
            loading={loading}
          />
        </div>

        {/* Split panel: table + detail */}
        <div className="flex gap-4 min-h-0">
          {/* Student table */}
          <div className="flex-1 bg-surface-card rounded-xl border border-surface-border overflow-hidden flex flex-col min-w-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-surface-border sticky top-0">
                  <tr>
                    {['Student','School','Grade','Absence %','Unexcused Days','Risk','Actions'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/>
                        </div>
                      </td>
                    </tr>
                  ) : truancy.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-txt-muted text-sm">
                        No students meet the truancy threshold for current filters.
                      </td>
                    </tr>
                  ) : truancy.map(s => {
                    const absRate = s.AbsenceRate ?? 0;
                    const isSelected = s.StudentId === selectedId;
                    return (
                      <tr
                        key={s.StudentId}
                        onClick={() => setSelectedId(isSelected ? null : s.StudentId)}
                        className={clsx(
                          'cursor-pointer transition-colors',
                          isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-txt-primary">{studentName(s)}</td>
                        <td className="px-4 py-3 text-txt-muted">{s.SchoolName ?? '—'}</td>
                        <td className="px-4 py-3 text-txt-muted">{s.GradeLevel ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-danger">{fmt.pct(absRate)}</td>
                        <td className="px-4 py-3 text-txt-muted">{s.UnexcusedAbsenceDays ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('risk-pill', riskClass(absRate))}>{riskLabel(absRate)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedId(s.StudentId); }}
                            className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-xs font-medium"
                          >
                            <FileText size={13} />
                            Letter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {truancy.length > 0 && !loading && (
              <div className="px-4 py-2.5 border-t border-surface-border text-xs text-txt-muted bg-gray-50">
                {truancy.length} students matching threshold
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-80 flex-shrink-0 bg-surface-card rounded-xl border border-surface-border p-5 space-y-4 animate-fade-in overflow-y-auto scrollbar-thin">
              <div>
                <h2 className="font-semibold text-txt-primary text-base">{studentName(selected)}</h2>
                <p className="text-xs text-txt-muted mt-0.5">Student #{selected.StudentNumber}</p>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ['School',         selected.SchoolName  ?? '—'],
                  ['Grade',          selected.GradeLevel  ?? '—'],
                  ['Absence Rate',   fmt.pct(selected.AbsenceRate ?? 0)],
                  ['Days Absent',    selected.AbsenceDays ?? 0],
                  ['Unexcused Days', selected.UnexcusedAbsenceDays ?? 0],
                  ['Risk Level',     riskLabel(selected.AbsenceRate ?? 0)],
                  ['Email',          selected.EMail ?? '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-txt-muted">{k}</span>
                    <span className="font-medium text-txt-primary text-right">{v}</span>
                  </div>
                ))}
              </div>

              {/* Letter template */}
              <div className="border-t border-surface-border pt-4">
                <p className="text-xs font-medium text-txt-muted mb-2">Truancy Notice Letter</p>
                <textarea
                  className="w-full h-40 text-xs p-3 border border-surface-border rounded-lg resize-none bg-surface-bg text-txt-primary focus:outline-none focus:border-brand-400"
                  defaultValue={`Dear Parent/Guardian,\n\nThis letter is to inform you that ${studentName(selected)} has been absent ${fmt.pct(selected.AbsenceRate ?? 0)} of school days this year.\n\nPlease contact us at your earliest convenience.\n\n[School letterhead content here]`}
                />
                <button className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors">
                  <FileText size={13} />
                  Generate PDF Letter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

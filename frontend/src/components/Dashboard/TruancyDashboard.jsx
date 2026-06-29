import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import FilterBar  from '@/components/Filters/FilterBar';
import KPICard    from '@/components/KPI/KPICard';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useStudents }  from '@/hooks/useStudents';
import { useMetrics }   from '@/hooks/useMetrics';
import { riskClass, riskLabel, fmt, downloadCSV } from '@/utils/helpers';
import clsx from 'clsx';

export default function TruancyDashboard() {
  const { data: metrics, loading: mLoading } = useMetrics();
  const { students, total, page, totalPages, loading, toggleSort, sortCol, sortDir, nextPage, prevPage } =
    useStudents({ riskLevel: 'chronic' });

  const [selectedId, setSelectedId] = useState(null);
  const selected = students.find((s) => s.student_id === selectedId);

  function handleExport() {
    const rows = [
      ['Student ID', 'Name', 'School', 'Grade', 'Absence Rate', 'Risk', 'Counselor', 'Intervention'],
      ...students.map((s) => [
        s.student_id, s.name ?? `${s.first_name} ${s.last_name}`,
        s.school_name ?? s.school, s.grade,
        fmt.pct(s.absence_rate ?? 0), riskLabel(s.absence_rate ?? 0),
        s.counselor ?? '—', s.intervention_status ?? 'None',
      ]),
    ];
    downloadCSV(rows, 'truancy_report.csv');
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="text-txt-light ml-1">↕</span>;
    return <span className="text-brand-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Truancy Officer Dashboard</h1>
          <p className="text-sm text-txt-muted mt-0.5">Students meeting truancy threshold — ready for letter generation</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
        >
          <Download size={15} />
          Export Report
        </button>
      </div>

      <FilterBar show={['schoolYear', 'school', 'grade', 'interventionStatus', 'search']} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Total Qualifying" value={total}        color="red"    loading={mLoading} />
        <KPICard label="No Intervention"  value={students.filter(s => s.intervention_status === 'none' || !s.intervention_status).length} color="yellow" loading={loading} />
        <KPICard label="Active Cases"     value={students.filter(s => s.intervention_status === 'active').length} color="blue"   loading={loading} />
      </div>

      {/* Split panel */}
      <div className="flex gap-4 min-h-0">
        {/* Student table */}
        <div className="flex-1 bg-surface-card rounded-xl border border-surface-border overflow-hidden flex flex-col">
          {loading ? (
            <LoadingSpinner className="m-12" />
          ) : (
            <>
              <div className="overflow-auto custom-scroll">
                <table className="w-full text-sm">
                  <thead className="bg-surface-bg border-b border-surface-border sticky top-0">
                    <tr>
                      {[['name','Student'],['school_name','School'],['grade','Gr'],['absence_rate','Absence %'],['risk','Risk'],['intervention_status','Status']].map(([col, label]) => (
                        <th
                          key={col}
                          onClick={() => toggleSort(col)}
                          className="text-left px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide cursor-pointer hover:text-txt-primary select-none"
                        >
                          {label}<SortIcon col={col} />
                        </th>
                      ))}
                      <th className="px-4 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {students.map((s) => {
                      const absRate = s.absence_rate ?? 0;
                      const isSelected = s.student_id === selectedId;
                      return (
                        <tr
                          key={s.student_id}
                          onClick={() => setSelectedId(isSelected ? null : s.student_id)}
                          className={clsx(
                            'cursor-pointer transition-colors',
                            isSelected ? 'bg-brand-50' : 'hover:bg-surface-bg'
                          )}
                        >
                          <td className="px-4 py-3 font-medium text-txt-primary">
                            {s.name ?? `${s.first_name} ${s.last_name}`}
                          </td>
                          <td className="px-4 py-3 text-txt-muted">{s.school_name ?? s.school ?? '—'}</td>
                          <td className="px-4 py-3 text-txt-muted">{s.grade}</td>
                          <td className="px-4 py-3 font-semibold text-danger">{fmt.pct(absRate)}</td>
                          <td className="px-4 py-3">
                            <span className={clsx('risk-pill', riskClass(absRate))}>{riskLabel(absRate)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              s.intervention_status === 'active' ? 'bg-brand-100 text-brand-700' :
                              s.intervention_status === 'completed' ? 'bg-success-light text-success-dark' :
                              'bg-surface-bg text-txt-muted'
                            )}>
                              {s.intervention_status ?? 'None'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedId(s.student_id); }}
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
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border text-xs text-txt-muted">
                <span>{total} students</span>
                <div className="flex gap-2">
                  <button onClick={prevPage} disabled={page <= 1} className="px-2 py-1 rounded disabled:opacity-30 hover:bg-surface-bg">← Prev</button>
                  <span className="px-2 py-1">Page {page}/{totalPages}</span>
                  <button onClick={nextPage} disabled={page >= totalPages} className="px-2 py-1 rounded disabled:opacity-30 hover:bg-surface-bg">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-surface-card rounded-xl border border-surface-border p-5 space-y-4 animate-fade-in overflow-y-auto custom-scroll">
            <h2 className="font-semibold text-txt-primary">
              {selected.name ?? `${selected.first_name} ${selected.last_name}`}
            </h2>
            <div className="space-y-2 text-sm">
              {[
                ['School',   selected.school_name ?? selected.school ?? '—'],
                ['Grade',    selected.grade],
                ['Absence Rate', fmt.pct(selected.absence_rate ?? 0)],
                ['Risk Level', riskLabel(selected.absence_rate ?? 0)],
                ['Counselor', selected.counselor ?? '—'],
                ['Intervention', selected.intervention_status ?? 'None'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-txt-muted">{k}</span>
                  <span className="font-medium text-txt-primary">{v}</span>
                </div>
              ))}
            </div>
            {/* Letter template (stub) */}
            <div className="border-t border-surface-border pt-4">
              <p className="text-xs text-txt-muted mb-2 font-medium">Truancy Notice Letter</p>
              <textarea
                className="w-full h-40 text-xs p-3 border border-surface-border rounded-lg resize-none bg-surface-bg text-txt-primary focus:outline-none focus:border-brand-400"
                defaultValue={`Dear Parent/Guardian,\n\nThis letter is to inform you that ${selected.name ?? 'your student'} has been absent ${(selected.absence_rate ?? 0).toFixed(1)}% of school days...\n\n[School letterhead content here]`}
              />
              <button className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy-dark">
                <FileText size={13} />
                Generate PDF Letter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

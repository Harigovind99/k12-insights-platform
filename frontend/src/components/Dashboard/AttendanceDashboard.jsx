import React, { useState, useMemo } from 'react';
import KPICard  from '@/components/KPI/KPICard';
import FilterBar from '@/components/Filters/FilterBar';
import {
  StackedHBarChart,
  DonutSvgChart,
  VerticalBarChart,
  LineSvgChart,
  HorizontalBarChart,
} from '@/components/Charts/SvgCharts';
import { useMetrics }    from '@/hooks/useMetrics';
import { useAttendance } from '@/hooks/useAttendance';
import { useFilters }    from '@/hooks/useFilters';
import { riskClass, riskLabel } from '@/utils/constants';

const SUB_TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'quarterly', label: 'Quarterly Trending Risk' },
  { id: 'chronic',   label: 'Chronic Absenteeism' },
];

const MONTH_ORDER = { 8:0, 9:1, 10:2, 11:3, 12:4, 1:5, 2:6, 3:7, 4:8, 5:9, 6:10 };
const MONTH_NAME  = { 8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec',1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun' };

function pctFmt(n)  { return `${Number(n || 0).toFixed(1)}%`; }
function numFmt(n)  { return Number(n || 0).toLocaleString(); }
function secFmt(n)  { return n != null ? Number(n).toFixed(1) : '—'; }

// ─── Data transformation helpers ─────────────────────────────────────────────

function toSchoolChartData(schoolData) {
  return (schoolData || []).map(s => {
    const total  = s.TotalSchoolDays || 1;
    const abs    = s.TotalAbsenceDays || 0;
    const exc    = s.ExcusedDays  || 0;
    const unex   = s.UnexcusedDays || 0;
    const tardy  = Math.max(0, abs - exc - unex);
    return {
      school:    s.SchoolName || 'Unknown',
      present:   parseFloat(((total - abs) / total * 100).toFixed(1)),
      excused:   parseFloat((exc  / total * 100).toFixed(1)),
      unexcused: parseFloat((unex / total * 100).toFixed(1)),
      tardy:     parseFloat((tardy / total * 100).toFixed(1)),
      total:     s.StudentCount || 0,
    };
  });
}

function toAbsenceTypeData(summary) {
  const exc  = summary?.TotalExcused   || 0;
  const unex = summary?.TotalUnexcused || 0;
  const tardy= summary?.TotalTardy     || 0;
  const tot  = exc + unex + tardy || 1;
  const excP = Math.round(exc  / tot * 100);
  const unxP = Math.round(unex / tot * 100);
  return [
    { label:'Excused',   pct: excP,              count: exc,  color:'#3b82f6' },
    { label:'Unexcused', pct: unxP,              count: unex, color:'#ef4444' },
    { label:'Tardy',     pct: Math.max(0,100-excP-unxP), count: tardy, color:'#8b5cf6' },
  ];
}

function toDowData(dow) {
  const MAP = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri' };
  const ORD = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
  return (dow || [])
    .filter(d => MAP[d.DayOfWeek])
    .sort((a,b) => ORD[a.DayOfWeek] - ORD[b.DayOfWeek])
    .map(d => ({ day: MAP[d.DayOfWeek], count: d.AbsenceCount || d.TotalAbsenceDays || 0 }));
}

function toTrendData(trend) {
  return (trend || [])
    .sort((a,b) => (MONTH_ORDER[a.Month] ?? 99) - (MONTH_ORDER[b.Month] ?? 99))
    .map(d => ({
      m:   MONTH_NAME[d.Month] || (d.MonthName || '').slice(0,3),
      cur: d.TotalAbsenceDays || 0,
      prev: 0,
    }));
}

function toChronicSchoolData(schoolData) {
  return (schoolData || [])
    .filter(s => (s.StudentCount || 0) > 0)
    .map(s => ({
      group: s.SchoolName || 'Unknown',
      rate:  s.StudentCount > 0
        ? parseFloat(((s.ChronicCount || 0) / s.StudentCount * 100).toFixed(1))
        : 0,
    }))
    .sort((a,b) => b.rate - a.rate);
}

// ─── Risk Level badge helper ─────────────────────────────────────────────────
function riskBadge(rate) {
  if (rate <  2)  return { text:'↑ On Track', color:'green'  };
  if (rate <  5)  return { text:'⚠ Moderate', color:'yellow' };
  if (rate < 10)  return { text:'↓ At Risk',  color:'yellow' };
  return               { text:'↓ Chronic',  color:'red'    };
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AttendanceDashboard() {
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState('overview');

  const { summary, schoolData, trend, dow, riskDist, loading: mLoading, error: mError, refresh } =
    useMetrics(filters);
  const { chronic, quarterly, loading: aLoading, error: aError } =
    useAttendance(filters);

  const loading = mLoading || aLoading;
  const error   = mError || aError;

  // ── Derived KPI values ───────────────────────────────────────────────────
  const attendanceRate  = summary ? parseFloat((100 - (summary.AvgAbsenceRate || 0)).toFixed(1)) : 0;
  const totalStudents   = summary?.TotalStudents   || 0;
  const chronicCount    = summary?.ChronicAbsentCount || 0;
  const avgDaysAbsent   = totalStudents > 0 ? parseFloat(((summary?.TotalAbsenceDays || 0) / totalStudents).toFixed(1)) : 0;

  const onTrackCount    = riskDist?.OnTrack  || 0;
  const moderateCount   = riskDist?.Moderate || 0;
  const atRiskCount     = riskDist?.AtRisk   || 0;
  const chronicRiskCount= riskDist?.Chronic  || 0;
  const riskTotal       = riskDist?.Total    || 1;

  const { text: badgeText, color: badgeColor } = riskBadge(summary?.AvgAbsenceRate || 0);

  // ── Chart data ───────────────────────────────────────────────────────────
  const schoolChartData  = useMemo(() => toSchoolChartData(schoolData),    [schoolData]);
  const absTypeData      = useMemo(() => toAbsenceTypeData(summary),       [summary]);
  const dowData          = useMemo(() => toDowData(dow),                   [dow]);
  const trendData        = useMemo(() => toTrendData(trend),               [trend]);
  const chronicBySchool  = useMemo(() => toChronicSchoolData(schoolData),  [schoolData]);

  // ── CSV rows for export ──────────────────────────────────────────────────
  const csvData = useMemo(() => {
    if (!schoolData?.length) return null;
    return [
      ['School','Students','Absence Rate %','Excused Days','Unexcused Days','Chronic Count'],
      ...(schoolData || []).map(s => [
        s.SchoolName, s.StudentCount, pctFmt(s.AbsenceRate),
        s.ExcusedDays, s.UnexcusedDays, s.ChronicCount,
      ]),
    ];
  }, [schoolData]);

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && !loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-sm">
          <p className="font-semibold text-red-700 mb-1">Failed to load attendance data</p>
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={refresh} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto animate-fade-in">

      {/* ── Sticky filter bar ─────────────────────────────────────────── */}
      <FilterBar
        show={['schoolYear','school','grade','group','absenceType','month']}
        data={csvData}
        csvFilename="attendance.csv"
        loading={loading}
      />

      <div className="p-6 space-y-6">

        {/* ── Page title ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Attendance Dashboard</h1>
          <p className="text-sm text-txt-muted mt-0.5">
            District-wide attendance insights for {filters.schoolYear || 'current year'}
          </p>
        </div>

        {/* ── Sub-tabs ────────────────────────────────────────────────── */}
        <div className="flex border-b border-surface-border gap-1">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ' +
                (activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-txt-muted hover:text-txt-primary')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════ OVERVIEW TAB ══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Overall Attendance Rate"
                value={attendanceRate}
                suffix="%"
                sub={`District avg · Goal: 96%`}
                badge={badgeText}
                badgeColor={badgeColor}
                loading={loading}
              />
              <KPICard
                label="Total Students"
                value={totalStudents}
                sub="enrolled this year"
                badge="↑ Enrolled"
                badgeColor="blue"
                loading={loading}
              />
              <KPICard
                label="Chronically Absent"
                value={chronicCount}
                sub={`${pctFmt((chronicCount / (totalStudents || 1)) * 100)} of students`}
                badge="↓ Monitor"
                badgeColor={chronicCount / (totalStudents || 1) >= 0.10 ? 'red' : 'yellow'}
                loading={loading}
              />
              <KPICard
                label="Avg Days Absent"
                value={avgDaysAbsent}
                suffix=" days"
                sub="per student this year"
                badge={avgDaysAbsent >= 18 ? '↓ Chronic' : avgDaysAbsent >= 9 ? '⚠ At-Risk' : '↑ On Track'}
                badgeColor={avgDaysAbsent >= 18 ? 'red' : avgDaysAbsent >= 9 ? 'yellow' : 'green'}
                loading={loading}
              />
            </div>

            {/* School breakdown stacked bar */}
            <div className="bg-surface-card rounded-xl border border-surface-border p-5">
              <h2 className="text-sm font-semibold text-txt-primary mb-4">
                Attendance Breakdown by School
              </h2>
              {loading
                ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                : <StackedHBarChart data={schoolChartData} h={Math.max(220, schoolChartData.length * 40 + 60)} />
              }
            </div>

            {/* 3-column charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Absence type donut */}
              <div className="bg-surface-card rounded-xl border border-surface-border p-5">
                <h2 className="text-sm font-semibold text-txt-primary mb-3">Absence Type Breakdown</h2>
                {loading
                  ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                  : <DonutSvgChart
                      data={absTypeData}
                      centerText={numFmt(summary?.TotalAbsenceDays || 0)}
                      w={260} h={260}
                    />
                }
              </div>

              {/* Day of week bar */}
              <div className="bg-surface-card rounded-xl border border-surface-border p-5">
                <h2 className="text-sm font-semibold text-txt-primary mb-3">Absences by Day of Week</h2>
                {loading
                  ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                  : <VerticalBarChart data={dowData} w={340} h={220} />
                }
              </div>

              {/* Monthly trend line */}
              <div className="bg-surface-card rounded-xl border border-surface-border p-5">
                <h2 className="text-sm font-semibold text-txt-primary mb-3">Monthly Absence Trend</h2>
                {loading
                  ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                  : <LineSvgChart data={trendData} w={340} h={220} isRate={false} />
                }
              </div>
            </div>
          </div>
        )}

        {/* ════════ QUARTERLY TAB ════════════════════════════════════════ */}
        {activeTab === 'quarterly' && (
          <div className="space-y-6">

            {/* Risk level KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="On Track"
                value={onTrackCount}
                sub={`${pctFmt(onTrackCount / riskTotal * 100)} of students`}
                badge="< 2% absent"
                badgeColor="green"
                loading={loading}
              />
              <KPICard
                label="Moderate Risk"
                value={moderateCount}
                sub={`${pctFmt(moderateCount / riskTotal * 100)} of students`}
                badge="2% – 5% absent"
                badgeColor="yellow"
                loading={loading}
              />
              <KPICard
                label="At Risk"
                value={atRiskCount}
                sub={`${pctFmt(atRiskCount / riskTotal * 100)} of students`}
                badge="5% – 10% absent"
                badgeColor="yellow"
                loading={loading}
              />
              <KPICard
                label="Chronically Absent"
                value={chronicRiskCount}
                sub={`${pctFmt(chronicRiskCount / riskTotal * 100)} of students`}
                badge="≥ 10% absent"
                badgeColor="red"
                loading={loading}
              />
            </div>

            {/* Risk distribution donut + Ohio HB 410 criteria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-surface-card rounded-xl border border-surface-border p-5">
                <h2 className="text-sm font-semibold text-txt-primary mb-3">Risk Distribution</h2>
                {loading
                  ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                  : <DonutSvgChart
                      data={[
                        { label:'On Track',  pct: Math.round(onTrackCount/riskTotal*100),    count: onTrackCount,    color:'#16a34a' },
                        { label:'Moderate',  pct: Math.round(moderateCount/riskTotal*100),   count: moderateCount,   color:'#d97706' },
                        { label:'At Risk',   pct: Math.round(atRiskCount/riskTotal*100),     count: atRiskCount,     color:'#ea580c' },
                        { label:'Chronic',   pct: Math.max(0,100-Math.round(onTrackCount/riskTotal*100)-Math.round(moderateCount/riskTotal*100)-Math.round(atRiskCount/riskTotal*100)), count: chronicRiskCount, color:'#dc2626' },
                      ]}
                      centerText={numFmt(riskTotal)}
                      w={260} h={260}
                    />
                }
              </div>

              <div className="bg-surface-card rounded-xl border border-surface-border p-5">
                <h2 className="text-sm font-semibold text-txt-primary mb-4">Ohio HB 410 Risk Criteria</h2>
                <div className="space-y-3">
                  {[
                    { label:'On Track',   threshold:'< 2% absent',    pct: pctFmt(onTrackCount/riskTotal*100),     count:onTrackCount,    color:'#16a34a', bg:'#d1fae5' },
                    { label:'Moderate',   threshold:'2% – 5% absent', pct: pctFmt(moderateCount/riskTotal*100),    count:moderateCount,   color:'#d97706', bg:'#fef3c7' },
                    { label:'At Risk',    threshold:'5% – 10% absent',pct: pctFmt(atRiskCount/riskTotal*100),      count:atRiskCount,     color:'#ea580c', bg:'#ffedd5' },
                    { label:'Chronic',    threshold:'≥ 10% absent',   pct: pctFmt(chronicRiskCount/riskTotal*100), count:chronicRiskCount,color:'#dc2626', bg:'#fee2e2' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: r.bg }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: r.color }}>{r.label}</p>
                        <p className="text-xs text-txt-muted">{r.threshold}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-txt-primary">{numFmt(r.count)}</p>
                        <p className="text-xs text-txt-muted">{r.pct}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chronic by school horizontal bar */}
            <div className="bg-surface-card rounded-xl border border-surface-border p-5">
              <h2 className="text-sm font-semibold text-txt-primary mb-4">
                Chronic Absenteeism Rate by School
              </h2>
              {loading
                ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                : <HorizontalBarChart data={chronicBySchool} threshold={10} w={580} />
              }
            </div>
          </div>
        )}

        {/* ════════ CHRONIC TAB ══════════════════════════════════════════ */}
        {activeTab === 'chronic' && (
          <div className="space-y-6">

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Chronically Absent"
                value={chronicCount}
                sub="≥ 10% days missed"
                badge="≥ 10%"
                badgeColor="red"
                loading={loading}
              />
              <KPICard
                label="Chronic Rate"
                value={parseFloat((chronicCount / (totalStudents || 1) * 100).toFixed(1))}
                suffix="%"
                sub="district-wide"
                badge={chronicCount/(totalStudents||1)>=0.20 ? '↓ Critical' : chronicCount/(totalStudents||1)>=0.10 ? '↓ Monitor' : '↑ On Track'}
                badgeColor={chronicCount/(totalStudents||1)>=0.20 ? 'red' : 'yellow'}
                loading={loading}
              />
              <KPICard
                label="Total Absence Days"
                value={summary?.TotalAbsenceDays || 0}
                sub="this school year"
                badge="All Types"
                badgeColor="blue"
                loading={loading}
              />
              <KPICard
                label="Avg Days Absent"
                value={avgDaysAbsent}
                suffix=" days"
                sub="per student"
                badge={avgDaysAbsent >= 18 ? '↓ Chronic' : '⚠ Watch'}
                badgeColor={avgDaysAbsent >= 18 ? 'red' : 'yellow'}
                loading={loading}
              />
            </div>

            {/* Chronic student table */}
            <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
                <h2 className="text-sm font-semibold text-txt-primary">
                  Chronic Absentees
                  <span className="ml-2 text-xs font-normal text-txt-muted">({numFmt(chronic?.length || 0)} students)</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-gray-50">
                      {['Student','School','Grade','Days Absent','Rate','Risk Level'].map(col => (
                        <th key={col} className="text-left text-xs font-semibold text-txt-muted px-4 py-2.5 uppercase tracking-wide">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-txt-muted text-sm">
                          <div className="flex items-center justify-center gap-1">
                            <span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/>
                          </div>
                        </td>
                      </tr>
                    ) : !chronic?.length ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-txt-muted text-sm">
                          No chronic absentees found for current filters.
                        </td>
                      </tr>
                    ) : (
                      chronic.slice(0, 100).map((s, i) => (
                        <tr key={s.StudentId || i} className="border-b border-surface-border last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-txt-primary">
                            {s.FirstName} {s.LastName}
                          </td>
                          <td className="px-4 py-3 text-txt-muted">{s.SchoolName}</td>
                          <td className="px-4 py-3 text-txt-muted">{s.GradeLevel}</td>
                          <td className="px-4 py-3 text-txt-primary font-medium">{s.AbsenceDays}</td>
                          <td className="px-4 py-3">
                            <span className={`risk-pill ${riskClass(s.AbsenceRate)}`}>
                              {pctFmt(s.AbsenceRate)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`risk-pill ${riskClass(s.AbsenceRate)}`}>
                              {riskLabel(s.AbsenceRate)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {chronic?.length > 100 && (
                <div className="px-5 py-3 border-t border-surface-border text-xs text-txt-muted">
                  Showing first 100 of {numFmt(chronic.length)} students. Download CSV to view all.
                </div>
              )}
            </div>

            {/* Chronic by school bar */}
            <div className="bg-surface-card rounded-xl border border-surface-border p-5">
              <h2 className="text-sm font-semibold text-txt-primary mb-4">Chronic Rate by School</h2>
              {loading
                ? <div className="flex items-center justify-center h-52"><div className="flex gap-1"><span className="loading-dot"/><span className="loading-dot"/><span className="loading-dot"/></div></div>
                : <HorizontalBarChart data={chronicBySchool} threshold={10} w={600} />
              }
            </div>
          </div>
        )}

      </div>{/* /p-6 */}
    </div>
  );
}

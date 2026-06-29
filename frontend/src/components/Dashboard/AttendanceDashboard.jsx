import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingDown, AlertTriangle, CalendarX, ArrowRight } from 'lucide-react';
import KPICard      from '@/components/KPI/KPICard';
import LineChart    from '@/components/Charts/LineChart';
import DonutChart   from '@/components/Charts/DonutChart';
import StackedBarChart from '@/components/Charts/StackedBarChart';
import FilterBar    from '@/components/Filters/FilterBar';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useMetrics } from '@/hooks/useMetrics';
import { useAttendance } from '@/hooks/useAttendance';
import { fmt } from '@/utils/helpers';

export default function AttendanceDashboard() {
  const { data: metrics, loading: mLoading, error: mError } = useMetrics();
  const { trend, byDOW, loading: aLoading } = useAttendance();

  const loading = mLoading || aLoading;

  if (mError) {
    return (
      <div className="rounded-xl bg-danger-light border border-red-200 p-6 text-danger-dark text-sm">
        Failed to load attendance data: {mError}
      </div>
    );
  }

  const riskCounts = metrics?.riskCounts ?? {};
  const bySchool   = metrics?.bySchool   ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Attendance Overview</h1>
          <p className="text-sm text-txt-muted mt-0.5">
            District-wide attendance summary and risk distribution
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/insights/attendance/quarterly"
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Quarterly View <ArrowRight size={14} />
          </Link>
          <Link
            to="/insights/attendance/chronic"
            className="flex items-center gap-1.5 text-sm text-danger hover:text-danger-dark font-medium ml-3"
          >
            Chronic Absenteeism <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        show={['schoolYear', 'school', 'grade', 'group', 'absenceType', 'month']}
        data={metrics ? buildCSVRows(metrics) : null}
        csvFilename="attendance_overview.csv"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Students"
          value={metrics?.totalStudents ?? 0}
          icon={<Users size={18} />}
          color="blue"
          loading={loading}
        />
        <KPICard
          label="Avg Attendance Rate"
          value={metrics?.avgAttendanceRate ?? 0}
          suffix="%"
          delta={metrics?.attendanceDelta}
          deltaLabel="vs last year"
          icon={<TrendingDown size={18} />}
          color="green"
          loading={loading}
        />
        <KPICard
          label="Chronic Absentees"
          value={metrics?.chronicAbsent ?? 0}
          icon={<AlertTriangle size={18} />}
          color="red"
          loading={loading}
        />
        <KPICard
          label="At-Risk Students"
          value={(riskCounts.atRisk ?? 0) + (riskCounts.moderate ?? 0)}
          icon={<CalendarX size={18} />}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line */}
        <div className="lg:col-span-2 bg-surface-card rounded-xl border border-surface-border p-5">
          <h2 className="text-sm font-semibold text-txt-primary mb-4">Monthly Attendance Rate</h2>
          {loading ? <LoadingSpinner className="h-[280px]" /> : (
            <LineChart data={trend} height={280} />
          )}
        </div>

        {/* Risk donut */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-5">
          <h2 className="text-sm font-semibold text-txt-primary mb-4">Risk Distribution</h2>
          {loading ? <LoadingSpinner className="h-[240px]" /> : (
            <DonutChart counts={riskCounts} height={240} />
          )}
        </div>
      </div>

      {/* By-school breakdown */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5">
        <h2 className="text-sm font-semibold text-txt-primary mb-4">Risk Breakdown by School</h2>
        {loading ? <LoadingSpinner className="h-[300px]" /> : (
          <StackedBarChart data={bySchool} height={300} />
        )}
      </div>
    </div>
  );
}

// ─── CSV helper ───────────────────────────────────────────────────────────────
function buildCSVRows(metrics) {
  return [
    ['School', 'Total Students', 'Attendance Rate %', 'Low', 'At Risk', 'Moderate', 'Chronic'],
    ...(metrics.bySchool ?? []).map((s) => [
      s.label, s.total ?? '', fmt.pct(s.rate ?? 0),
      s.low ?? 0, s.atRisk ?? 0, s.moderate ?? 0, s.chronic ?? 0,
    ]),
  ];
}

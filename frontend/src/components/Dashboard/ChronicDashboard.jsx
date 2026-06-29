import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import StackedBarChart from '@/components/Charts/StackedBarChart';
import FilterBar    from '@/components/Filters/FilterBar';
import KPICard      from '@/components/KPI/KPICard';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useAttendance } from '@/hooks/useAttendance';
import { useMetrics }    from '@/hooks/useMetrics';
import { fmt }           from '@/utils/helpers';

export default function ChronicDashboard() {
  const { chronic, loading: aLoading } = useAttendance();
  const { data: metrics, loading: mLoading } = useMetrics();
  const loading = aLoading || mLoading;

  const bySchool = chronic?.bySchool ?? [];
  const byGrade  = chronic?.byGrade  ?? [];
  const byGroup  = chronic?.byGroup  ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/insights/attendance" className="text-txt-muted hover:text-txt-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Chronic Absenteeism</h1>
          <p className="text-sm text-txt-muted mt-0.5">
            Students absent ≥ 10% of instructional days (California definition)
          </p>
        </div>
      </div>

      <FilterBar show={['schoolYear', 'school', 'grade', 'group', 'threshold']} />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Chronically Absent Students"
          value={metrics?.chronicAbsent ?? 0}
          icon={<AlertTriangle size={18} />}
          color="red"
          loading={loading}
        />
        <KPICard
          label="Chronic Rate"
          value={metrics?.chronicRate ?? 0}
          suffix="%"
          color="red"
          loading={loading}
        />
        <KPICard
          label="District Target"
          value="< 5%"
          color="green"
          loading={false}
        />
      </div>

      {loading ? (
        <LoadingSpinner className="mt-12" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <h2 className="text-sm font-semibold text-txt-primary mb-4">By School</h2>
            <StackedBarChart data={bySchool} height={280} />
          </div>
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <h2 className="text-sm font-semibold text-txt-primary mb-4">By Grade</h2>
            <StackedBarChart data={byGrade} height={280} />
          </div>
          <div className="lg:col-span-2 bg-surface-card rounded-xl border border-surface-border p-5">
            <h2 className="text-sm font-semibold text-txt-primary mb-4">By Student Group</h2>
            <StackedBarChart data={byGroup} height={260} />
          </div>
        </div>
      )}
    </div>
  );
}

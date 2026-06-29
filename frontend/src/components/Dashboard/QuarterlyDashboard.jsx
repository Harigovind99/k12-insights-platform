import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StackedBarChart from '@/components/Charts/StackedBarChart';
import FilterBar    from '@/components/Filters/FilterBar';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useAttendance } from '@/hooks/useAttendance';

export default function QuarterlyDashboard() {
  const { quarterly, loading, error } = useAttendance();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/insights/attendance" className="text-txt-muted hover:text-txt-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Quarterly Risk Trending</h1>
          <p className="text-sm text-txt-muted mt-0.5">Risk level shifts across Q1–Q4 by school</p>
        </div>
      </div>

      <FilterBar show={['schoolYear', 'school', 'grade', 'group', 'quarter']} />

      {error && (
        <div className="rounded-xl bg-danger-light border border-red-200 p-4 text-danger-dark text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner className="mt-16" />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
            const qData = quarterly.filter?.((r) => r.quarter === q) ?? quarterly;
            return (
              <div key={q} className="bg-surface-card rounded-xl border border-surface-border p-5">
                <h2 className="text-sm font-semibold text-txt-primary mb-4">{q} — Risk by School</h2>
                <StackedBarChart data={qData.length ? qData : quarterly} height={260} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

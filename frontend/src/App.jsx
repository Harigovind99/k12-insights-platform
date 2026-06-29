import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider }    from '@/contexts/AppContext';
import Sidebar            from '@/components/Layout/Sidebar';
import Header             from '@/components/Layout/Header';
import RoleBanner         from '@/components/Layout/RoleBanner';
import LoadingSpinner     from '@/components/Common/LoadingSpinner';
import { setNavigate }    from '@/api/routerNavigate';

// ─── Lazy-loaded route pages ──────────────────────────────────────────────────
const AttendanceDashboard = lazy(() => import('@/components/Dashboard/AttendanceDashboard'));
const QuarterlyDashboard  = lazy(() => import('@/components/Dashboard/QuarterlyDashboard'));
const ChronicDashboard    = lazy(() => import('@/components/Dashboard/ChronicDashboard'));
const TruancyDashboard    = lazy(() => import('@/components/Dashboard/TruancyDashboard'));
const StudentTable        = lazy(() => import('@/components/Student/StudentTable'));
const StudentProfile      = lazy(() => import('@/components/Student/StudentProfile'));
const SchemaModal         = lazy(() => import('@/components/Common/SchemaModal'));

// ─── Registers React Router navigate for 401 redirects ───────────────────────
function NavigateSetter() {
  const navigate = useNavigate();
  useEffect(() => { setNavigate(navigate); }, [navigate]);
  return null;
}

// Phase-2 stub
const ComingSoon = ({ domain }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 fade-in"
       style={{ color: '#64748b' }}>
    <span className="text-5xl">🚧</span>
    <h2 className="text-xl font-semibold" style={{ color: '#1e293b' }}>{domain}</h2>
    <p className="text-sm">This dashboard is scheduled for Phase 2 development.</p>
  </div>
);

export default function App() {
  return (
    <AppProvider>
      {/*
        Exact original shell:
          flex h-screen w-screen overflow-hidden
          left: aside (navy sidebar, 220px)
          right: flex-1 flex-col (header + main)
      */}
      <div className="flex h-screen w-screen overflow-hidden">
        <NavigateSetter />

        {/* LEFT SIDEBAR */}
        <Sidebar />

        {/* MAIN COLUMN */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header: top bar + domain tabs */}
          <Header />

          {/* Role view-as banner */}
          <RoleBanner />

          {/* Scrollable content — exact original: overflow-y-auto scrollbar-thin */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto scrollbar-thin"
            style={{ background: '#f0f4f8' }}
          >
            <Suspense fallback={<LoadingSpinner className="mt-20" />}>
              <Routes>
                {/* Default redirect */}
                <Route path="/"                              element={<Navigate to="/insights/attendance" replace />} />

                {/* Attendance */}
                <Route path="/insights/attendance"           element={<AttendanceDashboard />} />
                <Route path="/insights/attendance/quarterly" element={<QuarterlyDashboard />} />
                <Route path="/insights/attendance/chronic"   element={<ChronicDashboard />} />

                {/* Assessments */}
                <Route path="/insights/assessments"          element={<ComingSoon domain="Assessments" />} />

                {/* Truancy */}
                <Route path="/insights/truancy"              element={<TruancyDashboard />} />

                {/* Phase 2 stubs */}
                <Route path="/insights/early-warning"        element={<ComingSoon domain="Early Warning System" />} />
                <Route path="/insights/behavior"             element={<ComingSoon domain="Behavior Dashboard" />} />
                <Route path="/insights/mtss"                 element={<ComingSoon domain="MTSS / Interventions" />} />
                <Route path="/insights/graduation"           element={<ComingSoon domain="Graduation Readiness" />} />

                {/* Students */}
                <Route path="/students"                      element={<StudentTable />} />
                <Route path="/students/:id"                  element={<StudentProfile />} />

                {/* Schema */}
                <Route path="/schema"                        element={<SchemaModal standalone />} />

                {/* Catch-all */}
                <Route path="*"                              element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, User } from 'lucide-react';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { getStudent, getStudentAttendance, getStudentAssessments, getStudentInterventions, getStudentContacts } from '@/api/students';
import { riskClass, riskLabel, fmt, formatDate } from '@/utils/helpers';
import clsx from 'clsx';

export default function StudentProfile() {
  const { id } = useParams();
  const [student,       setStudent]       = useState(null);
  const [attendance,    setAttendance]    = useState([]);
  const [assessments,   setAssessments]   = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [contacts,      setContacts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [activeTab,     setActiveTab]     = useState('attendance');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([
      getStudent(id),
      getStudentAttendance(id),
      getStudentAssessments(id),
      getStudentInterventions(id),
      getStudentContacts(id),
    ]).then(([s, a, as_, iv, c]) => {
      if (s.status === 'fulfilled')  setStudent(s.value);
      else setError(s.reason?.message ?? 'Failed to load student');
      if (a.status  === 'fulfilled') setAttendance(a.value ?? []);
      if (as_.status === 'fulfilled') setAssessments(as_.value ?? []);
      if (iv.status === 'fulfilled') setInterventions(iv.value ?? []);
      if (c.status  === 'fulfilled') setContacts(c.value ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingSpinner className="mt-24" />;
  if (error || !student) return (
    <div className="rounded-xl bg-danger-light border border-red-200 p-6 text-danger-dark text-sm">
      {error ?? 'Student not found.'}
    </div>
  );

  const absRate = student.absence_rate ?? 0;
  const TABS = ['attendance', 'assessments', 'interventions', 'contacts'];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Back */}
      <Link to="/students" className="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary w-fit">
        <ArrowLeft size={15} /> Back to Students
      </Link>

      {/* Header card */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6 flex items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {(student.first_name?.[0] ?? '?')}{student.last_name?.[0] ?? ''}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-txt-primary">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-txt-muted text-sm">{student.school_name} · Grade {student.grade} · ID: {student.student_id}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className={clsx('risk-pill', riskClass(absRate))}>
              {riskLabel(absRate)} · {fmt.pct(absRate)} absent
            </span>
            {student.el_status && <span className="risk-pill bg-purple-light text-purple-dark">English Learner</span>}
            {student.sped_status && <span className="risk-pill bg-brand-100 text-brand-700">SPED</span>}
            {student.foster_youth && <span className="risk-pill bg-orange-100 text-orange-700">Foster Youth</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-bold text-txt-primary">{fmt.pct(absRate)}</p>
          <p className="text-xs text-txt-muted">Absence Rate</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              activeTab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-txt-muted hover:text-txt-primary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5">
        {activeTab === 'attendance' && (
          <AttendanceTab records={attendance} />
        )}
        {activeTab === 'assessments' && (
          <AssessmentsTab scores={assessments} />
        )}
        {activeTab === 'interventions' && (
          <InterventionsTab items={interventions} />
        )}
        {activeTab === 'contacts' && (
          <ContactsTab contacts={contacts} />
        )}
      </div>
    </div>
  );
}

// ─── Tab sub-components ───────────────────────────────────────────────────────
function AttendanceTab({ records }) {
  if (!records.length) return <Empty label="No attendance records found." />;
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-surface-border">
        <tr className="text-xs text-txt-muted uppercase tracking-wide">
          <th className="text-left pb-2">Date</th>
          <th className="text-left pb-2">Type</th>
          <th className="text-left pb-2">Code</th>
          <th className="text-left pb-2">Excused</th>
          <th className="text-left pb-2">Minutes Absent</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-border">
        {records.map((r, i) => (
          <tr key={i} className="hover:bg-surface-bg">
            <td className="py-2 pr-4">{formatDate(r.date)}</td>
            <td className="py-2 pr-4 capitalize">{r.attendance_type ?? '—'}</td>
            <td className="py-2 pr-4">{r.attendance_code ?? '—'}</td>
            <td className="py-2 pr-4">{r.excused_flag ? 'Yes' : 'No'}</td>
            <td className="py-2 pr-4">{r.minutes_absent ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AssessmentsTab({ scores }) {
  if (!scores.length) return <Empty label="No assessment scores found." />;
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-surface-border">
        <tr className="text-xs text-txt-muted uppercase tracking-wide">
          <th className="text-left pb-2">Assessment</th>
          <th className="text-left pb-2">Subject</th>
          <th className="text-left pb-2">Term</th>
          <th className="text-left pb-2">Score</th>
          <th className="text-left pb-2">Percentile</th>
          <th className="text-left pb-2">Proficiency</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-border">
        {scores.map((s, i) => (
          <tr key={i} className="hover:bg-surface-bg">
            <td className="py-2 pr-4">{s.assessment_name}</td>
            <td className="py-2 pr-4">{s.subject}</td>
            <td className="py-2 pr-4">{s.term}</td>
            <td className="py-2 pr-4 font-medium">{s.scale_score ?? s.raw_score}</td>
            <td className="py-2 pr-4">{s.percentile ? `${s.percentile}th` : '—'}</td>
            <td className="py-2 pr-4">{s.proficiency_level ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InterventionsTab({ items }) {
  if (!items.length) return <Empty label="No interventions on record." />;
  return (
    <div className="space-y-3">
      {items.map((iv, i) => (
        <div key={i} className="border border-surface-border rounded-lg p-4 text-sm">
          <div className="flex justify-between items-start">
            <p className="font-medium text-txt-primary capitalize">{iv.intervention_type}</p>
            <span className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
              iv.status === 'active' ? 'bg-brand-100 text-brand-700' : 'bg-success-light text-success-dark'
            )}>
              {iv.status}
            </span>
          </div>
          <p className="text-txt-muted mt-1">{formatDate(iv.start_date)} – {iv.end_date ? formatDate(iv.end_date) : 'Ongoing'}</p>
          {iv.notes && <p className="text-txt-muted mt-2 text-xs italic">{iv.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function ContactsTab({ contacts }) {
  if (!contacts.length) return <Empty label="No parent/guardian contacts on file." />;
  return (
    <div className="space-y-3">
      {contacts.map((c, i) => (
        <div key={i} className="border border-surface-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-bg flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-txt-muted" />
            </div>
            <div>
              <p className="font-medium text-txt-primary text-sm">{c.name}</p>
              <p className="text-xs text-txt-muted capitalize">{c.relationship}</p>
              <div className="flex gap-4 mt-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    <Phone size={12} />{c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    <Mail size={12} />{c.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="py-12 text-center text-txt-muted text-sm">{label}</div>
  );
}

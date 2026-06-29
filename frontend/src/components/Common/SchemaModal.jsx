import React from 'react';
import { X, Database } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const SCHEMA_TABLES = [
  {
    name: 'students',
    columns: [
      { name: 'student_id',         type: 'VARCHAR(20)', note: 'Primary key' },
      { name: 'school_id',          type: 'INT',         note: 'FK → schools' },
      { name: 'first_name',         type: 'VARCHAR(50)' },
      { name: 'last_name',          type: 'VARCHAR(50)' },
      { name: 'grade',              type: 'VARCHAR(5)' },
      { name: 'dob',                type: 'DATE' },
      { name: 'gender',             type: 'VARCHAR(10)' },
      { name: 'race_ethnicity',     type: 'VARCHAR(50)' },
      { name: 'el_status',          type: 'BOOLEAN' },
      { name: 'sped_status',        type: 'BOOLEAN' },
      { name: 'free_reduced_lunch', type: 'BOOLEAN' },
      { name: 'foster_youth',       type: 'BOOLEAN' },
      { name: 'homeless',           type: 'BOOLEAN' },
    ],
  },
  {
    name: 'attendance_records',
    columns: [
      { name: 'record_id',       type: 'INT',          note: 'Auto-increment PK' },
      { name: 'student_id',      type: 'VARCHAR(20)',  note: 'FK → students' },
      { name: 'date',            type: 'DATE' },
      { name: 'period',          type: 'INT' },
      { name: 'attendance_code', type: 'VARCHAR(5)' },
      { name: 'attendance_type', type: 'ENUM',        note: 'excused|unexcused|tardy|suspension' },
      { name: 'absence_reason',  type: 'VARCHAR(100)' },
      { name: 'excused_flag',    type: 'BOOLEAN' },
      { name: 'tardy_flag',      type: 'BOOLEAN' },
      { name: 'minutes_absent',  type: 'INT' },
    ],
  },
  {
    name: 'schools',
    columns: [
      { name: 'school_id',    type: 'INT',          note: 'Auto-increment PK' },
      { name: 'district_id',  type: 'INT' },
      { name: 'school_name',  type: 'VARCHAR(100)' },
      { name: 'school_type',  type: 'VARCHAR(20)',  note: 'elementary|middle|high' },
      { name: 'grades_served',type: 'VARCHAR(20)' },
      { name: 'principal_name',type:'VARCHAR(100)' },
      { name: 'address',      type: 'TEXT' },
      { name: 'phone',        type: 'VARCHAR(20)' },
    ],
  },
  {
    name: 'assessment_scores',
    columns: [
      { name: 'score_id',         type: 'INT',          note: 'Auto-increment PK' },
      { name: 'student_id',       type: 'VARCHAR(20)',  note: 'FK → students' },
      { name: 'assessment_name',  type: 'VARCHAR(50)',  note: 'NWEA MAP|Acadience|CAASPP' },
      { name: 'subject',          type: 'VARCHAR(30)' },
      { name: 'term',             type: 'VARCHAR(20)',  note: 'Fall|Winter|Spring' },
      { name: 'test_date',        type: 'DATE' },
      { name: 'raw_score',        type: 'DECIMAL(6,2)' },
      { name: 'scale_score',      type: 'DECIMAL(6,2)' },
      { name: 'percentile',       type: 'INT' },
      { name: 'proficiency_level',type: 'VARCHAR(30)' },
      { name: 'growth_points',    type: 'DECIMAL(5,2)' },
      { name: 'national_norm_rit',type: 'DECIMAL(5,2)' },
    ],
  },
  {
    name: 'interventions',
    columns: [
      { name: 'intervention_id',   type: 'INT',          note: 'Auto-increment PK' },
      { name: 'student_id',        type: 'VARCHAR(20)',  note: 'FK → students' },
      { name: 'assigned_staff_id', type: 'INT' },
      { name: 'intervention_type', type: 'VARCHAR(50)' },
      { name: 'start_date',        type: 'DATE' },
      { name: 'end_date',          type: 'DATE' },
      { name: 'status',            type: 'ENUM',         note: 'active|completed|none' },
      { name: 'notes',             type: 'TEXT' },
      { name: 'last_contact_date', type: 'DATE' },
    ],
  },
];

export default function SchemaModal({ standalone = false }) {
  const { schemaModalOpen, closeSchemaModal } = useAppContext();

  if (!standalone && !schemaModalOpen) return null;

  const content = (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Database size={20} className="text-brand-600" />
        <div>
          <h1 className="text-xl font-bold text-txt-primary">DASL Data Schema</h1>
          <p className="text-sm text-txt-muted mt-0.5">
            Core tables and field mapping for the K12 Insights Platform API
          </p>
        </div>
      </div>

      {SCHEMA_TABLES.map((table) => (
        <div key={table.name} className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
          <div className="px-5 py-3 bg-navy flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-white">{table.name}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-bg">
                <tr className="text-xs text-txt-muted uppercase tracking-wide">
                  <th className="text-left px-5 py-2">Column</th>
                  <th className="text-left px-5 py-2">Type</th>
                  <th className="text-left px-5 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {table.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-surface-bg">
                    <td className="px-5 py-2 font-mono text-brand-700 text-xs">{col.name}</td>
                    <td className="px-5 py-2 text-txt-muted text-xs">{col.type}</td>
                    <td className="px-5 py-2 text-txt-light text-xs italic">{col.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  if (standalone) return <div className="max-w-4xl">{content}</div>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && closeSchemaModal()}
    >
      <div className="bg-surface-bg rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scroll p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-brand-600" />
            <h2 className="text-lg font-bold text-txt-primary">DASL Data Schema</h2>
          </div>
          <button
            onClick={closeSchemaModal}
            aria-label="Close schema modal"
            className="p-2 rounded-lg hover:bg-surface-card text-txt-muted hover:text-txt-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

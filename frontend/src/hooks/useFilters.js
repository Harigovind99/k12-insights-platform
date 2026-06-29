import { useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { DEFAULT_FILTERS } from '@/utils/constants';

/**
 * Convenience hook that surfaces filter state and typed setters
 * from the global AppContext so components don't need raw dispatch.
 */
export function useFilters() {
  const { filters, setFilter, resetFilters } = useAppContext();

  const setSchoolYear         = useCallback((v) => setFilter({ schoolYear: v }),         [setFilter]);
  const setSchool             = useCallback((v) => setFilter({ school: v }),             [setFilter]);
  const setGrade              = useCallback((v) => setFilter({ grade: v }),              [setFilter]);
  const setGroup              = useCallback((v) => setFilter({ group: v }),              [setFilter]);
  const setAbsenceType        = useCallback((v) => setFilter({ absenceType: v }),        [setFilter]);
  const setMonth              = useCallback((v) => setFilter({ month: v }),              [setFilter]);
  const setQuarter            = useCallback((v) => setFilter({ quarter: v }),            [setFilter]);
  const setRiskLevel          = useCallback((v) => setFilter({ riskLevel: v }),          [setFilter]);
  const setThreshold          = useCallback((v) => setFilter({ threshold: Number(v) }), [setFilter]);
  const setInterventionStatus = useCallback((v) => setFilter({ interventionStatus: v }), [setFilter]);
  const setAssessmentSubject  = useCallback((v) => setFilter({ assessmentSubject: v }), [setFilter]);
  const setSearch             = useCallback((v) => setFilter({ search: v }),             [setFilter]);

  const isDirty = Object.keys(DEFAULT_FILTERS).some(
    (k) => filters[k] !== DEFAULT_FILTERS[k]
  );

  return {
    filters,
    isDirty,
    setSchoolYear,
    setSchool,
    setGrade,
    setGroup,
    setAbsenceType,
    setMonth,
    setQuarter,
    setRiskLevel,
    setThreshold,
    setInterventionStatus,
    setAssessmentSubject,
    setSearch,
    resetFilters,
    // raw patch setter for one-off cases
    setFilter,
  };
}

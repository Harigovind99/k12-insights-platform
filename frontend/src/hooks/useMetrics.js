import { useState, useEffect, useCallback } from 'react';
import {
  getAttendanceSummary,
  getSchoolBreakdown,
  getMonthlyTrend,
  getAbsenceByDOW,
  getRiskDistribution,
} from '@/api/attendance';

export function useMetrics(filters = {}) {
  const [summary,      setSummary]      = useState(null);
  const [schoolData,   setSchoolData]   = useState([]);
  const [trend,        setTrend]        = useState([]);
  const [dow,          setDow]          = useState([]);
  const [riskDist,     setRiskDist]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, sc, tr, d, rd] = await Promise.all([
        getAttendanceSummary(filters),
        getSchoolBreakdown(filters),
        getMonthlyTrend(filters),
        getAbsenceByDOW(filters),
        getRiskDistribution(filters),
      ]);
      setSummary(s);
      setSchoolData(sc);
      setTrend(tr);
      setDow(d);
      setRiskDist(rd);
    } catch (err) {
      setError(err.message || 'Failed to load attendance data');
      console.error('useMetrics error:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { summary, schoolData, trend, dow, riskDist, loading, error, refresh: fetchAll };
}

export default useMetrics;

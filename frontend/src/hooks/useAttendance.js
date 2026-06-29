import { useState, useEffect, useCallback } from 'react';
import {
  getChronicAbsentees,
  getQuarterlyRisk,
  getTruancyList,
} from '@/api/attendance';

export function useAttendance(filters = {}) {
  const [chronic,   setChronic]   = useState([]);
  const [quarterly, setQuarterly] = useState([]);
  const [truancy,   setTruancy]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ch, qu, tr] = await Promise.all([
        getChronicAbsentees(filters),
        getQuarterlyRisk(filters),
        getTruancyList(filters),
      ]);
      setChronic(ch);
      setQuarterly(qu);
      setTruancy(tr);
    } catch (err) {
      setError(err.message || 'Failed to load attendance data');
      console.error('useAttendance error:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { chronic, quarterly, truancy, loading, error, refresh: fetchAll };
}

export default useAttendance;

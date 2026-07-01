import { useState, useEffect } from 'react';
import { getSchools } from '@/api/schools';
import { SCHOOLS_DEFAULT } from '@/utils/constants';

/**
 * useSchools — fetches the district school list from /api/schools once
 * and memoises it for the session.  Falls back to SCHOOLS_DEFAULT (just
 * "All Schools") while loading or on error so the filter bar never breaks.
 *
 * Returns:
 *   schools  { id: string, name: string }[]
 *   loading  boolean
 *   error    string | null
 */
let _cache = null; // module-level cache so we fetch once across remounts

export function useSchools() {
  const [schools, setSchools] = useState(_cache ?? SCHOOLS_DEFAULT);
  const [loading, setLoading] = useState(_cache === null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (_cache !== null) return; // already fetched — skip

    let cancelled = false;
    setLoading(true);

    getSchools()
      .then((res) => {
        if (cancelled) return;
        // Backend returns { data: [...] } or array directly
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        // Normalise to { id, name }
        // Use SchoolName as the filter value because all SQL queries compare sch.SchoolName = @school
        const list = raw.map((s) => ({
          id:   s.SchoolName ?? s.name ?? s.schoolName ?? '(unknown)',
          name: s.SchoolName ?? s.name ?? s.schoolName ?? '(unknown)',
        }));
        const withAll = [{ id: 'all', name: 'All Schools' }, ...list];
        _cache = withAll;
        setSchools(withAll);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[useSchools] Failed to load schools:', err.message);
        setError(err.message ?? 'Failed to load schools');
        setSchools(SCHOOLS_DEFAULT);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { schools, loading, error };
}

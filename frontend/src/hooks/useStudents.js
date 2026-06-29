import { useState, useEffect, useRef, useCallback } from 'react';
import { getStudents } from '@/api/students';
import { useFilters } from './useFilters';

const PAGE_SIZE = 25;

/**
 * Fetches paginated, filtered student rows.
 * Returns { students, total, page, loading, error, nextPage, prevPage, refetch }.
 */
export function useStudents(extraParams = {}) {
  const { filters } = useFilters();
  const [students, setStudents] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [sortCol,  setSortCol]  = useState('name');
  const [sortDir,  setSortDir]  = useState('asc');
  const abortRef = useRef(null);

  const fetchData = useCallback(async (currentPage, col, dir) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await getStudents({
        ...filters,
        ...extraParams,
        page: currentPage,
        limit: PAGE_SIZE,
        sortCol: col,
        sortDir: dir,
      });
      if (!controller.signal.aborted) {
        setStudents(result.students ?? result.data ?? []);
        setTotal(result.total ?? 0);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message ?? 'Failed to load students');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [JSON.stringify(filters), JSON.stringify(extraParams)]); // eslint-disable-line

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchData(1, sortCol, sortDir);
    return () => abortRef.current?.abort();
  }, [JSON.stringify(filters)]); // eslint-disable-line

  const nextPage = useCallback(() => {
    const np = page + 1;
    setPage(np);
    fetchData(np, sortCol, sortDir);
  }, [page, sortCol, sortDir, fetchData]);

  const prevPage = useCallback(() => {
    const pp = Math.max(1, page - 1);
    setPage(pp);
    fetchData(pp, sortCol, sortDir);
  }, [page, sortCol, sortDir, fetchData]);

  const toggleSort = useCallback((col) => {
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc';
    setSortCol(col);
    setSortDir(newDir);
    fetchData(page, col, newDir);
  }, [sortCol, sortDir, page, fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    students, total, page, totalPages, loading, error,
    sortCol, sortDir, toggleSort,
    nextPage, prevPage,
    refetch: () => fetchData(page, sortCol, sortDir),
  };
}

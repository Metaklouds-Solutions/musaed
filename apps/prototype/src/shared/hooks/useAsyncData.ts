/**
 * Generic async data-fetching hook. Works with both sync and async fetcher functions.
 * Returns { data, loading, error, refetch }.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseAsyncDataResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAsyncData<T>(
  fetcher: () => T | Promise<T>,
  deps: unknown[],
  defaultValue: T,
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const callIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++callIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await Promise.resolve(fetcher());
      if (id === callIdRef.current) {
        setData(result);
      }
    } catch (err) {
      if (id === callIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (id === callIdRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

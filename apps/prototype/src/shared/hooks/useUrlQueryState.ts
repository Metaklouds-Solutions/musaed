import { useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

type UrlStateValue = string | undefined | null;
type UrlStateShape = Record<string, UrlStateValue>;

function readParam(searchParams: URLSearchParams, key: string, fallback: string): string {
  const value = searchParams.get(key);
  if (value === null) return fallback;
  return value;
}

export function useUrlQueryState<T extends UrlStateShape>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  const initialDefaults = defaultsRef.current;

  const state = useMemo(() => {
    const next = {} as Record<keyof T, string>;
    (Object.keys(initialDefaults) as Array<keyof T>).forEach((key) => {
      const fallback = initialDefaults[key] ?? '';
      next[key] = readParam(searchParams, String(key), String(fallback));
    });
    return next;
  }, [initialDefaults, searchParams]);

  const patchState = useCallback(
    (patch: Partial<Record<keyof T, string>>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        (Object.keys(initialDefaults) as Array<keyof T>).forEach((key) => {
          const current = patch[key];
          if (current === undefined) return;
          const value = current.trim();
          if (!value) next.delete(String(key));
          else next.set(String(key), value);
        });
        return next;
      });
    },
    [initialDefaults, setSearchParams]
  );

  const resetState = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      (Object.keys(initialDefaults) as Array<keyof T>).forEach((key) => {
        next.delete(String(key));
      });
      return next;
    });
  }, [initialDefaults, setSearchParams]);

  return { state, patchState, resetState };
}

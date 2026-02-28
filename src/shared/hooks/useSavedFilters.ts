/**
 * Hook for saved filters / views. Save current state, load saved, delete.
 */

import { useState, useCallback, useEffect } from 'react';
import { savedFiltersAdapter, type SavedFilter } from '../../adapters/local/savedFilters.adapter';

export interface UseSavedFiltersOptions<T extends Record<string, unknown>> {
  pageKey: string;
  currentFilters: T;
  onApply: (filters: T) => void;
}

export interface UseSavedFiltersReturn<T extends Record<string, unknown>> {
  saved: SavedFilter[];
  saveCurrent: (name: string) => void;
  apply: (id: string) => void;
  deleteFilter: (id: string) => void;
}

export function useSavedFilters<T extends Record<string, unknown>>({
  pageKey,
  currentFilters,
  onApply,
}: UseSavedFiltersOptions<T>): UseSavedFiltersReturn<T> {
  const [saved, setSaved] = useState<SavedFilter[]>(() =>
    savedFiltersAdapter.list(pageKey)
  );

  useEffect(() => {
    setSaved(savedFiltersAdapter.list(pageKey));
  }, [pageKey]);

  const saveCurrent = useCallback(
    (name: string) => {
      savedFiltersAdapter.save(pageKey, name, currentFilters as Record<string, unknown>);
      setSaved(savedFiltersAdapter.list(pageKey));
    },
    [pageKey, currentFilters]
  );

  const apply = useCallback(
    (id: string) => {
      const item = savedFiltersAdapter.get(id);
      if (item) {
        onApply(item.filters as T);
      }
    },
    [onApply]
  );

  const deleteFilter = useCallback((id: string) => {
    savedFiltersAdapter.delete(id);
    setSaved((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { saved, saveCurrent, apply, deleteFilter };
}

/**
 * Optimistic list updates. Add/remove/patch items in UI before adapter confirms. [PHASE-7-OPTIMISTIC-UPDATES]
 */

import { useMemo, useState, useCallback } from 'react';

export interface UseOptimisticListOptions<T> {
  items: T[];
  getKey: (item: T) => string;
}

export function useOptimisticList<T>({ items, getKey }: UseOptimisticListOptions<T>) {
  const [adds, setAdds] = useState<T[]>([]);
  const [removes, setRemoves] = useState<Set<string>>(new Set());
  const [patches, setPatches] = useState<Map<string, Partial<T>>>(new Map());

  const displayItems = useMemo(() => {
    const removed = removes;
    const base = items
      .filter((i) => !removed.has(getKey(i)))
      .map((i) => {
        const key = getKey(i);
        const patch = patches.get(key);
        return patch ? { ...i, ...patch } : i;
      });
    const baseKeys = new Set(base.map(getKey));
    const newAdds = adds.filter((a) => !baseKeys.has(getKey(a)));
    return [...base, ...newAdds];
  }, [items, adds, removes, patches, getKey]);

  const addOptimistic = useCallback((item: T) => {
    setAdds((prev) => [...prev, item]);
  }, []);

  const removeOptimistic = useCallback((key: string) => {
    setRemoves((prev) => new Set(prev).add(key));
  }, []);

  const patchOptimistic = useCallback((key: string, patch: Partial<T>) => {
    setPatches((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) ?? {};
      next.set(key, { ...existing, ...patch });
      return next;
    });
  }, []);

  const rollbackAdd = useCallback((key: string) => {
    setAdds((prev) => prev.filter((i) => getKey(i) !== key));
  }, [getKey]);

  const rollbackRemove = useCallback((key: string) => {
    setRemoves((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const rollbackPatch = useCallback((key: string) => {
    setPatches((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const commit = useCallback(() => {
    setAdds([]);
    setRemoves(new Set());
    setPatches(new Map());
  }, []);

  return {
    items: displayItems,
    addOptimistic,
    removeOptimistic,
    patchOptimistic,
    rollbackAdd,
    rollbackRemove,
    rollbackPatch,
    commit,
  };
}

/**
 * Table row selection state. [PHASE-7-BULK-ACTIONS]
 */

import { useState, useCallback } from 'react';

export function useTableSelection(getKey: (item: unknown) => string) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback(
    (key: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    []
  );

  const toggleAll = useCallback((items: unknown[]) => {
    setSelected((prev) => {
      const keys = items.map(getKey);
      const allSelected = keys.every((k) => prev.has(k));
      if (allSelected) return new Set();
      return new Set(keys);
    });
  }, [getKey]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback(
    (key: string) => selected.has(key),
    [selected]
  );

  const allSelected = useCallback(
    (items: unknown[]) => items.length > 0 && items.every((i) => selected.has(getKey(i))),
    [selected, getKey]
  );

  return {
    selected: Array.from(selected),
    selectedSet: selected,
    toggle,
    toggleAll,
    clear,
    isSelected,
    allSelected,
  };
}

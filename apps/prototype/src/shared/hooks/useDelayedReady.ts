/**
 * Returns false for a brief delay, then true. Use for skeleton loading on mount. [PHASE-7-SKELETON-LOADING]
 */

import { useState, useEffect } from 'react';

const DEFAULT_MS = 150;

export function useDelayedReady(delayMs = DEFAULT_MS): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return ready;
}

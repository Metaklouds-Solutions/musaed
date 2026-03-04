/**
 * Admin system health. Adapter only; platform-wide.
 * Returns extended health (Retell, DB, API, Webhooks).
 */

import { useMemo } from 'react';
import { adminAdapter } from '../../../adapters';

/** Returns admin system health snapshot, preferring extended adapter fields when available. */
export function useAdminSystem() {
  const systemHealth = useMemo(
    () => adminAdapter.getSystemHealthExtended?.() ?? adminAdapter.getSystemHealth(),
    []
  );
  return useMemo(() => ({ systemHealth }), [systemHealth]);
}

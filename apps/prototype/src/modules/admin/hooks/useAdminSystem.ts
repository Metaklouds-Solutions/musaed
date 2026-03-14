/**
 * Admin system health. Adapter only; platform-wide.
 * Returns extended health (Retell, DB, API, Webhooks).
 */

import { adminAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

/** Returns admin system health snapshot, preferring extended adapter fields when available. */
export function useAdminSystem() {
  const { data: systemHealth, loading } = useAsyncData(
    () => adminAdapter.getSystemHealthExtended?.() ?? adminAdapter.getSystemHealth(),
    [],
    { status: 'ok' as const, integrations: [] },
  );
  return { systemHealth, loading };
}

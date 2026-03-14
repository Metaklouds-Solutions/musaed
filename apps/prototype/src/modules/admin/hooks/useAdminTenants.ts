/**
 * Admin tenants list. Adapter only; platform-wide.
 * Pass refreshKey to force refetch (e.g. after Add Tenant).
 */

import { adminAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminTenantRow } from '../../../shared/types';

/** Returns top-level admin tenant collection, refreshed via refresh key updates. */
export function useAdminTenants(refreshKey?: number) {
  const { data: tenants, loading, refetch } = useAsyncData(
    () => adminAdapter.getTenants(),
    [refreshKey],
    [] as AdminTenantRow[],
  );
  return { tenants, loading, refetch };
}

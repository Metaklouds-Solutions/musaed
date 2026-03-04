/**
 * Admin tenants list. Adapter only; platform-wide.
 * Pass refreshKey to force refetch (e.g. after Add Tenant).
 */

import { useMemo } from 'react';
import { adminAdapter } from '../../../adapters';

/** Returns top-level admin tenant collection, refreshed via refresh key updates. */
export function useAdminTenants(refreshKey?: number) {
  const tenants = useMemo(() => adminAdapter.getTenants(), [refreshKey]);
  return useMemo(() => ({ tenants }), [tenants]);
}

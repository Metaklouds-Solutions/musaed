/**
 * Admin tenants list. Adapter only; platform-wide.
 * Pass refreshKey to force refetch (e.g. after Add Tenant).
 */

import { useMemo } from 'react';
import { adminAdapter } from '../../../adapters';

export function useAdminTenants(refreshKey?: number) {
  const tenants = useMemo(() => adminAdapter.getTenants(), [refreshKey]);
  return useMemo(() => ({ tenants }), [tenants]);
}

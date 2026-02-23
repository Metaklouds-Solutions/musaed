/**
 * Admin tenants list. Adapter only; platform-wide.
 */

import { useMemo } from 'react';
import { adminAdapter } from '../../../adapters';

export function useAdminTenants() {
  const tenants = useMemo(() => adminAdapter.getTenants(), []);
  return useMemo(() => ({ tenants }), [tenants]);
}

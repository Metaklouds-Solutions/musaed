/**
 * Tenant staff hook. Tenant-scoped list.
 */

import { useMemo, useState, useCallback } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { staffAdapter } from '../../../adapters/local/staff.adapter';

export function useStaff() {
  const { user } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);

  const tenantId = user?.tenantId ?? null;

  const staff = useMemo(() => {
    if (!tenantId) return [];
    return staffAdapter.list(tenantId);
  }, [tenantId, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { staff, tenantId, refetch };
}

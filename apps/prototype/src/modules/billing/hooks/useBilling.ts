/**
 * Billing overview and actions. Adapter only; tenant-scoped via session.
 */

import { useCallback, useMemo, useState } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { billingAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { BillingOverview } from '../../../shared/types';

export function useBilling() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: overview, loading, refetch } = useAsyncData(
    () => (tenantId ? billingAdapter.getBillingOverview(tenantId) : undefined),
    [tenantId, refreshKey],
    undefined as BillingOverview | undefined
  );

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const buyCredits = useCallback(() => {
    if (tenantId == null) return;
    billingAdapter.buyCredits(tenantId);
    refresh();
  }, [tenantId, refresh]);

  return useMemo(
    () => ({ overview, loading, buyCredits, refresh, tenantId }),
    [overview, loading, buyCredits, refresh, tenantId]
  );
}

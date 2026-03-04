/**
 * Billing overview and actions. Adapter only; tenant-scoped via session.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { billingAdapter } from '../../../adapters';
import type { BillingOverview } from '../../../shared/types';

export function useBilling() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [overview, setOverview] = useState<BillingOverview | undefined>(() =>
    tenantId ? billingAdapter.getBillingOverview(tenantId) : undefined
  );

  const refresh = useCallback(() => {
    setOverview(tenantId ? billingAdapter.getBillingOverview(tenantId) : undefined);
  }, [tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const buyCredits = useCallback(() => {
    if (tenantId == null) return;
    billingAdapter.buyCredits(tenantId);
    refresh();
  }, [tenantId, refresh]);

  return useMemo(
    () => ({ overview, buyCredits, refresh, tenantId }),
    [overview, buyCredits, refresh, tenantId]
  );
}

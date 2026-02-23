/**
 * Dashboard data hook. Calls adapters only; no business logic.
 * Returns metrics, funnel, trend for current tenant (from session).
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { dashboardAdapter } from '../../../adapters';

export function useDashboard() {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user) return undefined;
    if (user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const metrics = useMemo(() => dashboardAdapter.getMetrics(tenantId), [tenantId]);
  const funnel = useMemo(() => dashboardAdapter.getFunnel(tenantId), [tenantId]);
  const trend = useMemo(() => dashboardAdapter.getTrend(tenantId), [tenantId]);

  return { user, tenantId, metrics, funnel, trend };
}

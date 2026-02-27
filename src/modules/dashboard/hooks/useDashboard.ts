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
  const kpis = useMemo(() => dashboardAdapter.getTenantKpis(tenantId), [tenantId]);
  const agentStatus = useMemo(() => dashboardAdapter.getTenantAgentStatus(tenantId), [tenantId]);
  const staffCounts = useMemo(() => dashboardAdapter.getTenantStaffCounts(tenantId), [tenantId]);
  const openTickets = useMemo(() => dashboardAdapter.getTenantOpenTickets(tenantId, 5), [tenantId]);
  const recentCalls = useMemo(() => dashboardAdapter.getTenantRecentCalls(tenantId, 10), [tenantId]);

  return {
    user,
    tenantId,
    metrics,
    funnel,
    trend,
    kpis,
    agentStatus,
    staffCounts,
    openTickets,
    recentCalls,
  };
}

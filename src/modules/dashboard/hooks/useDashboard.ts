/**
 * Dashboard data hook. Calls adapters only; no business logic.
 * Returns metrics, funnel, trend for current tenant (from session).
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { dashboardAdapter } from '../../../adapters';
import type { DateRangeFilter } from '../../../adapters/local/dashboard.adapter';

export function useDashboard(dateRange?: DateRangeFilter) {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user) return undefined;
    if (user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const metrics = useMemo(() => dashboardAdapter.getMetrics(tenantId, dateRange), [tenantId, dateRange]);
  const funnel = useMemo(() => dashboardAdapter.getFunnel(tenantId, dateRange), [tenantId, dateRange]);
  const trend = useMemo(() => dashboardAdapter.getTrend(tenantId, dateRange), [tenantId, dateRange]);
  const kpis = useMemo(() => dashboardAdapter.getTenantKpis(tenantId, dateRange), [tenantId, dateRange]);
  const agentStatus = useMemo(() => dashboardAdapter.getTenantAgentStatus(tenantId), [tenantId]);
  const staffCounts = useMemo(() => dashboardAdapter.getTenantStaffCounts(tenantId), [tenantId]);
  const openTickets = useMemo(() => dashboardAdapter.getTenantOpenTickets(tenantId, 5), [tenantId]);
  const recentCalls = useMemo(() => dashboardAdapter.getTenantRecentCalls(tenantId, 10, dateRange), [tenantId, dateRange]);

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

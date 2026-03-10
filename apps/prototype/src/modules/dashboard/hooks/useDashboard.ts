/**
 * Dashboard data hook. Calls adapters only; no business logic.
 * Returns metrics, funnel, trend for current tenant (from session).
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { dashboardAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { DateRangeFilter } from '../../../adapters/local/dashboard.adapter';
import type { DashboardMetrics, TenantKpis } from '../../../shared/types';

const defaultMetrics: DashboardMetrics = {
  totalBookings: 0, conversionRate: 0, callsHandled: 0,
  escalationRate: 0, costSaved: 0, aiConfidenceScore: 0,
};

const defaultKpis: TenantKpis = {
  callsToday: 0, calls7d: 0, appointmentsBooked: 0, escalations: 0,
  missedNoAnswer: 0, failedCalls: 0, avgDurationSec: 0,
  topOutcome: '—', minutesUsed: 0, creditBalance: 0,
};

export function useDashboard(dateRange?: DateRangeFilter) {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user) return undefined;
    if (user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const { data: metrics, loading } = useAsyncData(
    () => dashboardAdapter.getMetrics(tenantId, dateRange),
    [tenantId, dateRange],
    defaultMetrics,
  );
  const { data: funnel } = useAsyncData(
    () => dashboardAdapter.getFunnel(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );
  const { data: trend } = useAsyncData(
    () => dashboardAdapter.getTrend(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );
  const { data: kpis } = useAsyncData(
    () => dashboardAdapter.getTenantKpis(tenantId, dateRange),
    [tenantId, dateRange],
    defaultKpis,
  );
  const { data: agentStatus } = useAsyncData(
    () => dashboardAdapter.getTenantAgentStatus(tenantId),
    [tenantId],
    null
  );
  const { data: staffCounts } = useAsyncData(
    () => dashboardAdapter.getTenantStaffCounts(tenantId),
    [tenantId],
    { doctors: 0, receptionists: 0, total: 0 },
  );
  const { data: openTickets } = useAsyncData(
    () => dashboardAdapter.getTenantOpenTickets(tenantId, 5),
    [tenantId],
    [],
  );
  const { data: recentCalls } = useAsyncData(
    () => dashboardAdapter.getTenantRecentCalls(tenantId, 10, dateRange),
    [tenantId, dateRange],
    []
  );
  const { data: roi } = useAsyncData(
    () => dashboardAdapter.getRoiMetrics(tenantId, dateRange),
    [tenantId, dateRange],
    { revenue: 0, aiCost: 0, costSaved: 0, roiPercent: 0, totalMinutes: 0 }
  );

  return {
    user,
    tenantId,
    metrics,
    loading,
    funnel,
    trend,
    kpis,
    agentStatus,
    staffCounts,
    openTickets,
    recentCalls,
    roi,
  };
}

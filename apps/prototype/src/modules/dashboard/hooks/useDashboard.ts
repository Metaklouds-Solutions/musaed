/**
 * Dashboard data hook. Calls adapters only; no business logic.
 * Returns metrics, funnel, trend for current tenant (from session).
 */

import { useEffect, useMemo, useState } from 'react';
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
  const [refreshTick, setRefreshTick] = useState(0);
  const tenantId = useMemo(() => {
    if (!user) return undefined;
    if (user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  useEffect(() => {
    const onRefresh = () => setRefreshTick((t) => t + 1);
    window.addEventListener('dashboard:refresh', onRefresh);
    return () => {
      window.removeEventListener('dashboard:refresh', onRefresh);
    };
  }, []);

  const { data: summary, loading } = useAsyncData(
    () => dashboardAdapter.getSummary(tenantId, dateRange),
    [tenantId, dateRange, refreshTick],
    {
      metrics: defaultMetrics,
      kpis: defaultKpis,
      signal: { status: 'empty' as const, reason: 'Dashboard summary unavailable.' },
    },
  );
  const metrics = summary.metrics ?? defaultMetrics;
  const { data: funnel } = useAsyncData(
    () => dashboardAdapter.getFunnel(tenantId, dateRange),
    [tenantId, dateRange, refreshTick],
    []
  );
  const { data: trend } = useAsyncData(
    () => dashboardAdapter.getTrend(tenantId, dateRange),
    [tenantId, dateRange, refreshTick],
    []
  );
  const kpis = summary.kpis ?? defaultKpis;
  const { data: agentStatus } = useAsyncData(
    () => dashboardAdapter.getTenantAgentStatus(tenantId),
    [tenantId, refreshTick],
    null
  );
  const { data: staffCounts } = useAsyncData(
    () => dashboardAdapter.getTenantStaffCounts(tenantId),
    [tenantId, refreshTick],
    { doctors: 0, receptionists: 0, total: 0 },
  );
  const { data: openTickets } = useAsyncData(
    () => dashboardAdapter.getTenantOpenTickets(tenantId, 5),
    [tenantId, refreshTick],
    [],
  );
  const { data: recentCalls } = useAsyncData(
    () => dashboardAdapter.getTenantRecentCalls(tenantId, 10, dateRange),
    [tenantId, dateRange, refreshTick],
    []
  );
  const { data: roi } = useAsyncData(
    () => dashboardAdapter.getRoiMetrics(tenantId, dateRange),
    [tenantId, dateRange, refreshTick],
    { revenue: 0, aiCost: 0, costSaved: 0, roiPercent: 0, totalMinutes: 0 }
  );

  return {
    user,
    tenantId,
    metrics,
    summary,
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

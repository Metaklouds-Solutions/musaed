/**
 * Admin overview hook. Adapters only; no tenant filter (platform-wide).
 */

import { useSession } from '../../../app/session/SessionContext';
import { adminAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminOverviewMetrics, AdminSystemHealthExtended } from '../../../shared/types';

const defaultMetrics: AdminOverviewMetrics = {
  mrr: 0, creditsRevenue: 0, totalRevenue: 0, paymentFailures: [],
  planDistribution: [], activeTenants: 0, activeAgents: 0,
  aiMinutesUsed: 0, platformCallsHandled: 0, platformBookingsCreated: 0,
  platformConversionRate: 0, escalationRate: 0,
  usageAnomalies: [], churnRiskList: [],
};

const defaultSystemHealth: AdminSystemHealthExtended = {
  status: 'ok',
  integrations: [],
  retellSync: 'ok',
  webhooks: 'ok',
};

/** Returns admin overview dashboard aggregates and role-gated session state. */
export function useAdminOverview() {
  const { user } = useSession();
  const defaultSummary = {
    overview: defaultMetrics,
    kpis: {
      totalTenants: 0,
      activeTenants: 0,
      trialTenants: 0,
      suspendedTenants: 0,
      callsToday: 0,
      calls7d: 0,
      bookedPercent: 0,
      escalationPercent: 0,
      failedPercent: 0,
      totalCostUsd: 0,
    },
    recentTenants: [],
    supportSnapshot: { openCount: 0, criticalCount: 0, oldestWaitingDays: 0 },
    recentCalls: [],
    systemHealth: defaultSystemHealth,
    signal: { status: 'empty' as const, reason: 'Dashboard summary unavailable.' },
  };
  const { data: summary, loading } = useAsyncData(
    () => adminAdapter.getDashboardSummary(),
    [],
    defaultSummary,
  );
  const metrics = summary.overview ?? defaultMetrics;
  const kpis = summary.kpis ?? defaultSummary.kpis;
  const recentTenants = summary.recentTenants ?? defaultSummary.recentTenants;
  const supportSnapshot = summary.supportSnapshot ?? defaultSummary.supportSnapshot;
  const recentCalls = summary.recentCalls ?? defaultSummary.recentCalls;
  const systemHealth: AdminSystemHealthExtended =
    summary.systemHealth ?? defaultSystemHealth;
  const isAdmin = user?.role === 'ADMIN';
  return {
    user,
    isAdmin,
    metrics,
    loading,
    kpis,
    recentTenants,
    supportSnapshot,
    recentCalls,
    systemHealth,
  };
}

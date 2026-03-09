/**
 * Admin overview hook. Adapters only; no tenant filter (platform-wide).
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { adminAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminOverviewMetrics } from '../../../shared/types';

const defaultMetrics: AdminOverviewMetrics = {
  mrr: 0, creditsRevenue: 0, totalRevenue: 0, paymentFailures: [],
  planDistribution: [], activeTenants: 0, activeAgents: 0,
  aiMinutesUsed: 0, platformCallsHandled: 0, platformBookingsCreated: 0,
  platformConversionRate: 0, escalationRate: 0,
  usageAnomalies: [], churnRiskList: [],
};

/** Returns admin overview dashboard aggregates and role-gated session state. */
export function useAdminOverview() {
  const { user } = useSession();
  const { data: metrics, loading } = useAsyncData(
    () => adminAdapter.getOverview(),
    [],
    defaultMetrics,
  );
  const kpis = useMemo(() => adminAdapter.getAdminKpis(), []);
  const recentTenants = useMemo(() => adminAdapter.getRecentTenants(5), []);
  const supportSnapshot = useMemo(() => adminAdapter.getSupportSnapshot(), []);
  const recentCalls = useMemo(() => adminAdapter.getRecentCalls(10), []);
  const systemHealth = useMemo(
    () => adminAdapter.getSystemHealthExtended?.() ?? adminAdapter.getSystemHealth(),
    []
  );
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

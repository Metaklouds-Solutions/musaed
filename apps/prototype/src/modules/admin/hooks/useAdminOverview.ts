/**
 * Admin overview hook. Adapters only; no tenant filter (platform-wide).
 */

import { useSession } from '../../../app/session/SessionContext';
import { adminAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminPulseKpis, AdminHealth } from '../../../shared/types';

const defaultKpis: AdminPulseKpis = {
  activeTenants: 0,
  activeAgents: 0,
  callsToday: 0,
  calls7d: 0,
  bookedPercent: 0,
  escalationPercent: 0,
  aiMinutesUsed: 0,
  estimatedCostUsd: 0,
};

const defaultHealth: AdminHealth = {
  retellSync: 'ok',
  webhooks: 'ok',
  uptimeSeconds: 0,
};

/** Returns admin overview dashboard aggregates and role-gated session state. */
export function useAdminOverview() {
  const { user } = useSession();
  const defaultSummary = {
    signal: { status: 'empty' as const, reason: 'Dashboard summary unavailable.' },
    health: defaultHealth,
    kpis: defaultKpis,
    recentTenants: [] as Array<{
      id: string;
      name: string;
      plan: string;
      status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
      createdAt: string;
      onboardingProgress: number;
    }>,
    supportSnapshot: { openCount: 0, criticalCount: 0, oldestWaitingDays: 0 },
    recentCalls: [] as Array<{
      id: string;
      tenantId: string;
      tenantName: string;
      agentName: string;
      outcome: 'booked' | 'escalated' | 'failed' | 'pending';
      duration: number;
      startedAt: string;
    }>,
  };
  const { data: summary, loading } = useAsyncData(
    () => adminAdapter.getDashboardSummary(),
    [],
    defaultSummary,
  );
  const signal = summary.signal ?? defaultSummary.signal;
  const health: AdminHealth = summary.health ?? defaultHealth;
  const kpis: AdminPulseKpis = summary.kpis ?? defaultKpis;
  const recentTenants = summary.recentTenants ?? defaultSummary.recentTenants;
  const supportSnapshot = summary.supportSnapshot ?? defaultSummary.supportSnapshot;
  const recentCalls = summary.recentCalls ?? defaultSummary.recentCalls;
  const isAdmin = user?.role === 'ADMIN';
  return {
    user,
    isAdmin,
    signal,
    health,
    kpis,
    recentTenants,
    supportSnapshot,
    recentCalls,
    loading,
  };
}

/**
 * API admin adapter. Fetches admin overview from backend.
 */

import { api } from '../../lib/apiClient';
import type { AdminOverviewMetrics, AdminTenantRow, SystemHealth, AdminKpis, AdminSupportSnapshot, AdminSystemHealthExtended } from '../../shared/types';

const defaultOverview: AdminOverviewMetrics = {
  mrr: 0, creditsRevenue: 0, totalRevenue: 0, paymentFailures: [],
  planDistribution: [], activeTenants: 0, activeAgents: 0,
  aiMinutesUsed: 0, platformCallsHandled: 0, platformBookingsCreated: 0,
  platformConversionRate: 0, escalationRate: 0,
  usageAnomalies: [], churnRiskList: [],
};

export const adminAdapter = {
  async getOverview(): Promise<AdminOverviewMetrics> {
    try {
      const overview = await api.get<any>('/admin/overview');
      return {
        ...defaultOverview,
        activeTenants: overview.totalTenants ?? overview.activeTenants ?? 0,
        activeAgents: overview.totalAgents ?? 0,
        ...overview,
      };
    } catch {
      return defaultOverview;
    }
  },

  async getTenants(): Promise<AdminTenantRow[]> {
    try {
      const resp = await api.get<{ data: any[] }>('/admin/tenants?page=1&limit=100');
      return (resp.data ?? []).map((t: any) => ({
        id: t._id,
        name: t.name,
        plan: t.planId?.name ?? '—',
      }));
    } catch {
      return [];
    }
  },

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const health = await api.get<any>('/admin/system');
      return { status: health.status ?? 'ok', integrations: [] };
    } catch {
      return { status: 'ok', integrations: [] };
    }
  },

  getAdminKpis(): AdminKpis {
    return {
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
    };
  },

  getRecentTenants(_limit?: number) {
    return [];
  },

  getSupportSnapshot(): AdminSupportSnapshot {
    return { openCount: 0, criticalCount: 0, oldestWaitingDays: 0 };
  },

  getRecentCalls(_limit?: number) {
    return [];
  },

  getSystemHealthExtended(): AdminSystemHealthExtended {
    return { status: 'ok', integrations: [], retellSync: 'ok', webhooks: 'ok' };
  },

  getBillingOverview() {
    return [];
  },
};

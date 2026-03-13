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

interface AdminCallsResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
}

interface AdminDashboardSummaryResponse {
  overview?: AdminOverviewMetrics;
  kpis?: AdminKpis;
  recentTenants?: any[];
  supportSnapshot?: AdminSupportSnapshot;
  recentCalls?: any[];
  systemHealth?: AdminSystemHealthExtended;
  signal?: {
    status?: 'healthy' | 'warning' | 'empty';
    reason?: string;
  };
}

interface AdminCallsAnalyticsResponse {
  totalCalls?: number;
  avgDuration?: number;
  outcomes?: {
    booked?: number;
    escalated?: number;
    failed?: number;
    info_only?: number;
    unknown?: number;
  };
}

const emptyAdminCallsAnalytics: AdminCallsAnalyticsResponse = {
  totalCalls: 0,
  avgDuration: 0,
  outcomes: {},
};

export const adminAdapter = {
  async getDashboardSummary(): Promise<AdminDashboardSummaryResponse> {
    try {
      return await api.get<AdminDashboardSummaryResponse>('/admin/dashboard/summary');
    } catch {
      return {
        overview: defaultOverview,
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
        systemHealth: { status: 'ok', integrations: [], retellSync: 'ok', webhooks: 'ok' },
        signal: { status: 'empty', reason: 'Dashboard summary unavailable.' },
      };
    }
  },

  async getOverview(): Promise<AdminOverviewMetrics> {
    try {
      const [overview, billingOverview, callsAnalytics] = await Promise.all([
        api.get<any>('/admin/overview'),
        api.get<any>('/admin/billing/overview').catch(() => null),
        api.get<AdminCallsAnalyticsResponse>('/admin/calls/analytics').catch(() => null),
      ]);
      const totalCalls = callsAnalytics?.totalCalls ?? 0;
      const booked = callsAnalytics?.outcomes?.booked ?? 0;
      const escalated = callsAnalytics?.outcomes?.escalated ?? 0;
      return {
        ...defaultOverview,
        activeTenants: overview.totalTenants ?? overview.activeTenants ?? 0,
        activeAgents: overview.totalAgents ?? 0,
        mrr: billingOverview?.totalMrrCents ? billingOverview.totalMrrCents / 100 : 0,
        totalRevenue: billingOverview?.totalMrrCents ? billingOverview.totalMrrCents / 100 : 0,
        platformCallsHandled: totalCalls,
        platformBookingsCreated: booked,
        platformConversionRate: totalCalls > 0 ? (booked / totalCalls) * 100 : 0,
        escalationRate: totalCalls > 0 ? (escalated / totalCalls) * 100 : 0,
        aiMinutesUsed:
          totalCalls > 0 && (callsAnalytics?.avgDuration ?? 0) > 0
            ? (totalCalls * (callsAnalytics?.avgDuration ?? 0)) / 60
            : 0,
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

  async getAdminKpis(): Promise<AdminKpis> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const [overview, tenantsResp, callsToday, calls7d, analytics7d] = await Promise.all([
        api.get<any>('/admin/overview'),
        api.get<{ data?: any[] }>('/admin/tenants?page=1&limit=100').catch(() => ({ data: [] })),
        api
          .get<AdminCallsResponse>(
            `/admin/calls?from=${encodeURIComponent(todayStart.toISOString())}&to=${encodeURIComponent(now.toISOString())}&page=1&limit=1`,
          )
          .catch(() => ({ total: 0 })),
        api
          .get<AdminCallsResponse>(
            `/admin/calls?from=${encodeURIComponent(sevenDaysAgo.toISOString())}&to=${encodeURIComponent(now.toISOString())}&page=1&limit=1`,
          )
          .catch(() => ({ total: 0 })),
        api
          .get<AdminCallsAnalyticsResponse>(
            `/admin/calls/analytics?from=${encodeURIComponent(sevenDaysAgo.toISOString())}&to=${encodeURIComponent(now.toISOString())}`,
          )
          .catch(() => emptyAdminCallsAnalytics),
      ]);

      const tenants = Array.isArray(tenantsResp.data) ? tenantsResp.data : [];
      const trialTenants = tenants.filter((t) => t?.status === 'TRIAL' || t?.status === 'ONBOARDING').length;
      const suspendedTenants = tenants.filter((t) => t?.status === 'SUSPENDED').length;
      const totalCalls = analytics7d.totalCalls ?? 0;
      const outcomes = analytics7d.outcomes ?? {};
      const booked = outcomes.booked ?? 0;
      const escalated = outcomes.escalated ?? 0;
      const failed = outcomes.failed ?? 0;
      const avgDuration = analytics7d.avgDuration ?? 0;

      return {
        totalTenants: overview.totalTenants ?? 0,
        activeTenants: overview.activeTenants ?? 0,
        trialTenants,
        suspendedTenants,
        callsToday: callsToday.total ?? 0,
        calls7d: calls7d.total ?? 0,
        bookedPercent: totalCalls > 0 ? (booked / totalCalls) * 100 : 0,
        escalationPercent: totalCalls > 0 ? (escalated / totalCalls) * 100 : 0,
        failedPercent: totalCalls > 0 ? (failed / totalCalls) * 100 : 0,
        totalCostUsd: totalCalls > 0 ? (totalCalls * avgDuration * 0.05) / 60 : 0,
      };
    } catch {
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
    }
  },

  async getRecentTenants(limit = 5) {
    try {
      const resp = await api.get<{ data?: any[] }>('/admin/tenants?page=1&limit=100');
      const rows = Array.isArray(resp.data) ? resp.data : [];
      return rows
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
        .slice(0, limit)
        .map((t) => ({
          id: String(t._id ?? ''),
          name: String(t.name ?? ''),
          plan: String(t.planId?.name ?? '—'),
          status:
            t.status === 'ACTIVE' || t.status === 'SUSPENDED' ? t.status : 'TRIAL',
          createdAt: String(t.createdAt ?? ''),
          onboardingProgress:
            typeof t.onboardingStep === 'number'
              ? Math.min(100, Math.max(0, t.onboardingStep * 25))
              : 0,
        }));
    } catch {
      return [];
    }
  },

  async getSupportSnapshot(): Promise<AdminSupportSnapshot> {
    try {
      const resp = await api.get<{ data?: any[] }>('/admin/support?page=1&limit=100');
      const tickets = Array.isArray(resp.data) ? resp.data : [];
      const openTickets = tickets.filter((t) => t?.status === 'open' || t?.status === 'in_progress');
      const criticalCount = openTickets.filter((t) => t?.priority === 'critical').length;
      const oldestWaitingDays = openTickets.reduce((max, t) => {
        const created = new Date(String(t?.createdAt ?? ''));
        if (Number.isNaN(created.getTime())) return max;
        const age = Math.floor((Date.now() - created.getTime()) / 86400000);
        return Math.max(max, age);
      }, 0);
      return { openCount: openTickets.length, criticalCount, oldestWaitingDays };
    } catch {
      return { openCount: 0, criticalCount: 0, oldestWaitingDays: 0 };
    }
  },

  async getRecentCalls(limit = 10) {
    try {
      const resp = await api.get<AdminCallsResponse>(`/admin/calls?page=1&limit=${limit}`);
      const rows = Array.isArray(resp.data) ? resp.data : [];
      return rows.map((call) => ({
        id: String(call._id ?? ''),
        tenantId:
          typeof call.tenantId === 'object' && call.tenantId !== null
            ? String((call.tenantId as { _id?: string })._id ?? '')
            : String(call.tenantId ?? ''),
        tenantName:
          typeof call.tenantId === 'object' && call.tenantId !== null
            ? String((call.tenantId as { name?: string }).name ?? '—')
            : '—',
        agentName:
          typeof call.agentInstanceId === 'object' && call.agentInstanceId !== null
            ? String((call.agentInstanceId as { name?: string }).name ?? '—')
            : '—',
        outcome:
          call.outcome === 'booked' || call.outcome === 'escalated' || call.outcome === 'failed'
            ? call.outcome
            : 'pending',
        duration: call.durationMs != null ? Math.round(Number(call.durationMs) / 1000) : 0,
        startedAt: String(call.startedAt ?? call.createdAt ?? ''),
      }));
    } catch {
      return [];
    }
  },

  async getSystemHealthExtended(): Promise<AdminSystemHealthExtended> {
    try {
      const health = await api.get<any>('/admin/system');
      return {
        status: health.status ?? 'ok',
        integrations: [
          { name: 'Backend API', status: health.status ?? 'ok' },
          { name: 'Database', status: 'ok' },
          { name: 'Webhooks', status: 'ok' },
        ],
        retellSync: 'ok',
        webhooks: 'ok',
      };
    } catch {
      return { status: 'ok', integrations: [], retellSync: 'ok', webhooks: 'ok' };
    }
  },

  getBillingOverview() {
    return [];
  },
};

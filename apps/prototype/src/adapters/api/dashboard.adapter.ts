/**
 * API dashboard adapter. Fetches metrics from backend.
 */

import { api } from '../../lib/apiClient';
import type {
  DashboardMetrics,
  FunnelStage,
  TrendPoint,
  RoiMetrics,
  TenantKpis,
  TenantAgentStatus,
  TenantStaffCounts,
  TenantOpenTicket,
  TenantRecentCall,
} from '../../shared/types';

interface DateRangeFilter { start: Date; end: Date }
interface TenantDashboardSummaryResponse {
  kpis?: TenantKpis;
  metrics?: DashboardMetrics;
  signal?: {
    status?: 'healthy' | 'warning' | 'empty';
    reason?: string;
  };
}
interface TenantCallsListResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
}
interface TenantCallsAnalyticsResponse {
  totalCalls?: number;
  conversationRate?: number;
  avgDuration?: number;
  outcomes?: {
    booked?: number;
    escalated?: number;
    failed?: number;
    info_only?: number;
    unknown?: number;
  };
}

const emptyTenantCallsAnalytics: TenantCallsAnalyticsResponse = {
  totalCalls: 0,
  avgDuration: 0,
  outcomes: {},
};

const defaultMetrics: DashboardMetrics = {
  totalBookings: 0, conversionRate: 0, callsHandled: 0,
  escalationRate: 0, costSaved: 0, aiConfidenceScore: 0,
};

const defaultKpis: TenantKpis = {
  callsToday: 0, calls7d: 0, appointmentsBooked: 0, escalations: 0,
  missedNoAnswer: 0, failedCalls: 0, avgDurationSec: 0,
  topOutcome: '—', minutesUsed: 0, creditBalance: 0,
};

const defaultStaffCounts: TenantStaffCounts = { doctors: 0, receptionists: 0, total: 0 };

export const dashboardAdapter = {
  async getSummary(_tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<TenantDashboardSummaryResponse> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString());
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString());
      const suffix = params.toString();
      return await api.get<TenantDashboardSummaryResponse>(
        `/tenant/dashboard/summary${suffix ? `?${suffix}` : ''}`,
      );
    } catch {
      return {
        kpis: defaultKpis,
        metrics: defaultMetrics,
        signal: { status: 'empty', reason: 'Dashboard summary unavailable.' },
      };
    }
  },

  async getMetrics(_tenantId: string | undefined, _dateRange?: DateRangeFilter): Promise<DashboardMetrics> {
    try {
      const data = await api.get<{
        totalBookings?: number;
        totalCalls?: number;
        callOutcomes?: { booked?: number; escalated?: number; failed?: number };
        avgCallDurationMs?: number;
      }>('/tenant/dashboard/metrics');
      const totalCalls = data.totalCalls ?? 0;
      const outcomes = data.callOutcomes ?? {};
      const booked = outcomes.booked ?? 0;
      const escalated = outcomes.escalated ?? 0;
      const avgMs = data.avgCallDurationMs ?? 0;
      const totalMinutes = totalCalls > 0 ? (avgMs * totalCalls) / 60_000 : 0;
      const costSaved = totalMinutes * 2;
      return {
        totalBookings: data.totalBookings ?? 0,
        conversionRate: totalCalls > 0 ? (booked / totalCalls) * 100 : 0,
        callsHandled: totalCalls,
        escalationRate: totalCalls > 0 ? (escalated / totalCalls) * 100 : 0,
        costSaved,
        aiConfidenceScore: 0,
      };
    } catch {
      return defaultMetrics;
    }
  },

  async getFunnel(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<FunnelStage[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<FunnelStage[]>(`/tenant/dashboard/funnel?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getTrend(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<TrendPoint[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<TrendPoint[]>(`/tenant/dashboard/trend?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getRoiMetrics(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<RoiMetrics> {
    if (!tenantId) return { revenue: 0, aiCost: 0, costSaved: 0, roiPercent: 0, totalMinutes: 0 };
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<RoiMetrics>(`/tenant/dashboard/roi?${params.toString()}`);
      return {
        revenue: data.revenue ?? 0,
        aiCost: data.aiCost ?? 0,
        costSaved: data.costSaved ?? 0,
        roiPercent: data.roiPercent ?? 0,
        totalMinutes: data.totalMinutes ?? 0,
      };
    } catch {
      return { revenue: 0, aiCost: 0, costSaved: 0, roiPercent: 0, totalMinutes: 0 };
    }
  },

  async getTenantKpis(_tenantId: string | undefined, _dateRange?: DateRangeFilter): Promise<TenantKpis> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const [metrics, callsToday, calls7d, analytics7d] = await Promise.all([
        api.get<{
          totalBookings?: number;
          totalCalls?: number;
          callOutcomes?: { booked?: number; escalated?: number; failed?: number; unknown?: number };
          avgCallDurationMs?: number;
        }>('/tenant/dashboard/metrics'),
        api
          .get<TenantCallsListResponse>(
            `/tenant/calls?from=${encodeURIComponent(todayStart.toISOString())}&to=${encodeURIComponent(now.toISOString())}&page=1&limit=1`,
          )
          .catch(() => ({ total: 0 })),
        api
          .get<TenantCallsListResponse>(
            `/tenant/calls?from=${encodeURIComponent(sevenDaysAgo.toISOString())}&to=${encodeURIComponent(now.toISOString())}&page=1&limit=1`,
          )
          .catch(() => ({ total: 0 })),
        api
          .get<TenantCallsAnalyticsResponse>(
            `/tenant/calls/analytics?from=${encodeURIComponent(sevenDaysAgo.toISOString())}&to=${encodeURIComponent(now.toISOString())}`,
          )
          .catch(() => emptyTenantCallsAnalytics),
      ]);
      const totalCalls = metrics.totalCalls ?? analytics7d.totalCalls ?? 0;
      const outcomes = metrics.callOutcomes ?? analytics7d.outcomes ?? {};
      const booked = outcomes.booked ?? 0;
      const escalated = outcomes.escalated ?? 0;
      const failed = outcomes.failed ?? 0;
      const topOutcome =
        booked >= escalated && booked >= failed
          ? 'booked'
          : escalated >= failed
            ? 'escalated'
            : failed > 0
              ? 'failed'
              : '—';
      const avgDurationMs =
        metrics.avgCallDurationMs ?? ((analytics7d.avgDuration ?? 0) * 1000);
      const totalMinutes = totalCalls > 0 ? (avgDurationMs * totalCalls) / 60_000 : 0;
      return {
        callsToday: callsToday.total ?? 0,
        calls7d: calls7d.total ?? 0,
        appointmentsBooked: metrics.totalBookings ?? 0,
        escalations: escalated,
        missedNoAnswer: 0,
        failedCalls: failed,
        avgDurationSec: avgDurationMs / 1000,
        topOutcome,
        minutesUsed: totalMinutes,
        creditBalance: 0,
      };
    } catch {
      return defaultKpis;
    }
  },

  async getTenantAgentStatus(tenantId: string | undefined): Promise<TenantAgentStatus | null> {
    if (!tenantId) return null;
    try {
      const data = await api.get<TenantAgentStatus | null>('/tenant/dashboard/agent-status');
      return data;
    } catch {
      return null;
    }
  },

  async getTenantStaffCounts(tenantId: string | undefined): Promise<TenantStaffCounts> {
    if (!tenantId) return defaultStaffCounts;
    try {
      const data = await api.get<{ staffCounts?: TenantStaffCounts }>('/tenant/dashboard/metrics');
      return data.staffCounts ?? defaultStaffCounts;
    } catch {
      return defaultStaffCounts;
    }
  },

  async getTenantOpenTickets(tenantId: string | undefined, limit = 5): Promise<TenantOpenTicket[]> {
    if (!tenantId) return [];
    try {
      const data = await api.get<{ openTicketsList?: Array<{ id?: string; title?: string; status?: string; priority?: string; createdAt?: string }> }>('/tenant/dashboard/metrics');
      const list = data.openTicketsList ?? [];
      return list.slice(0, limit).map((t) => ({
        id: t.id ?? '',
        title: t.title ?? '',
        status: t.status ?? '',
        priority: t.priority ?? 'medium',
        createdAt: t.createdAt ?? new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  async getTenantRecentCalls(tenantId: string | undefined, limit = 10, dateRange?: DateRangeFilter): Promise<TenantRecentCall[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<TenantRecentCall[]>(`/tenant/dashboard/recent-calls?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

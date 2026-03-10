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
      const data = await api.get<{
        totalBookings?: number;
        totalCalls?: number;
        callOutcomes?: { booked?: number; escalated?: number; failed?: number; unknown?: number };
        avgCallDurationMs?: number;
      }>('/tenant/dashboard/metrics');
      const totalCalls = data.totalCalls ?? 0;
      const outcomes = data.callOutcomes ?? {};
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
      const totalMinutes = totalCalls > 0 ? ((data.avgCallDurationMs ?? 0) * totalCalls) / 60_000 : 0;
      return {
        callsToday: 0,
        calls7d: 0,
        appointmentsBooked: data.totalBookings ?? 0,
        escalations: escalated,
        missedNoAnswer: 0,
        failedCalls: failed,
        avgDurationSec: (data.avgCallDurationMs ?? 0) / 1000,
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

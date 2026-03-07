/**
 * API dashboard adapter. Fetches metrics from backend, serves cached data synchronously.
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

const cache = {
  metrics: null as DashboardMetrics | null,
  funnel: null as FunnelStage[] | null,
  trend: null as TrendPoint[] | null,
  roi: null as RoiMetrics | null,
  tenantKpis: null as TenantKpis | null,
  agentStatus: null as TenantAgentStatus | null,
  staffCounts: null as TenantStaffCounts | null,
  openTickets: null as TenantOpenTicket[] | null,
  recentCalls: null as TenantRecentCall[] | null,
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
  getMetrics(_tenantId: string | undefined, _dateRange?: DateRangeFilter): DashboardMetrics {
    return cache.metrics ?? defaultMetrics;
  },
  getFunnel(_tenantId: string | undefined, _dateRange?: DateRangeFilter): FunnelStage[] {
    return cache.funnel ?? [];
  },
  getTrend(_tenantId: string | undefined, _dateRange?: DateRangeFilter): TrendPoint[] {
    return cache.trend ?? [];
  },
  getRoiMetrics(_tenantId: string | undefined, _dateRange?: DateRangeFilter): RoiMetrics {
    return cache.roi ?? { revenue: 0, aiCost: 0, costSaved: 0, roiPercent: 0, totalMinutes: 0 };
  },
  getTenantKpis(_tenantId: string | undefined, _dateRange?: DateRangeFilter): TenantKpis {
    return cache.tenantKpis ?? defaultKpis;
  },
  getTenantAgentStatus(_tenantId: string | undefined): TenantAgentStatus | null {
    return cache.agentStatus;
  },
  getTenantStaffCounts(_tenantId: string | undefined): TenantStaffCounts {
    return cache.staffCounts ?? defaultStaffCounts;
  },
  getTenantOpenTickets(_tenantId: string | undefined, _limit?: number): TenantOpenTicket[] {
    return cache.openTickets ?? [];
  },
  getTenantRecentCalls(_tenantId: string | undefined, _limit?: number, _dateRange?: DateRangeFilter): TenantRecentCall[] {
    return cache.recentCalls ?? [];
  },

  async refresh(): Promise<void> {
    try {
      const data = await api.get<any>('/tenant/dashboard/metrics');
      cache.metrics = {
        totalBookings: data.totalBookings ?? 0,
        conversionRate: data.conversionRate ?? 0,
        callsHandled: data.callsHandled ?? 0,
        escalationRate: data.escalationRate ?? 0,
        costSaved: data.costSaved ?? 0,
        aiConfidenceScore: data.aiConfidenceScore ?? 0,
      };
      if (data.tenantKpis) cache.tenantKpis = data.tenantKpis;
    } catch {
      // keep cache as-is
    }
  },
};

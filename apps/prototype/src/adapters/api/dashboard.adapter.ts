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
      const data = await api.get<any>('/tenant/dashboard/metrics');
      return {
        totalBookings: data.totalBookings ?? 0,
        conversionRate: data.conversionRate ?? 0,
        callsHandled: data.callsHandled ?? 0,
        escalationRate: data.escalationRate ?? 0,
        costSaved: data.costSaved ?? 0,
        aiConfidenceScore: data.aiConfidenceScore ?? 0,
      };
    } catch {
      return defaultMetrics;
    }
  },

  getFunnel(_tenantId: string | undefined, _dateRange?: DateRangeFilter): FunnelStage[] {
    return [];
  },

  getTrend(_tenantId: string | undefined, _dateRange?: DateRangeFilter): TrendPoint[] {
    return [];
  },

  getRoiMetrics(_tenantId: string | undefined, _dateRange?: DateRangeFilter): RoiMetrics {
    return { revenue: 0, aiCost: 0, costSaved: 0, roiPercent: 0, totalMinutes: 0 };
  },

  async getTenantKpis(_tenantId: string | undefined, _dateRange?: DateRangeFilter): Promise<TenantKpis> {
    try {
      const data = await api.get<any>('/tenant/dashboard/metrics');
      return {
        callsToday: 0,
        calls7d: 0,
        appointmentsBooked: data.totalBookings ?? 0,
        escalations: 0,
        missedNoAnswer: 0,
        failedCalls: 0,
        avgDurationSec: 0,
        topOutcome: '—',
        minutesUsed: 0,
        creditBalance: 0,
      };
    } catch {
      return defaultKpis;
    }
  },

  getTenantAgentStatus(_tenantId: string | undefined): TenantAgentStatus | null {
    return null;
  },

  getTenantStaffCounts(_tenantId: string | undefined): TenantStaffCounts {
    return defaultStaffCounts;
  },

  getTenantOpenTickets(_tenantId: string | undefined, _limit?: number): TenantOpenTicket[] {
    return [];
  },

  getTenantRecentCalls(_tenantId: string | undefined, _limit?: number, _dateRange?: DateRangeFilter): TenantRecentCall[] {
    return [];
  },
};

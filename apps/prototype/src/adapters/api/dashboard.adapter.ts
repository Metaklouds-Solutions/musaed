/**
 * API dashboard adapter (placeholder). Replace with real API when backend exists.
 */

import type { DashboardMetrics, FunnelStage, TrendPoint } from '../../shared/types';

export const dashboardAdapter = {
  getMetrics(_tenantId: string | undefined): DashboardMetrics {
    return {
      totalBookings: 0,
      conversionRate: 0,
      callsHandled: 0,
      escalationRate: 0,
      costSaved: 0,
      aiConfidenceScore: 0,
    };
  },
  getFunnel(_tenantId: string | undefined): FunnelStage[] {
    return [];
  },
  getTrend(_tenantId: string | undefined): TrendPoint[] {
    return [];
  },
};

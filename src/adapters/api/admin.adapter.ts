/**
 * API admin adapter (placeholder). Replace with real API when backend exists.
 */

import type { AdminOverviewMetrics, AdminTenantRow, SystemHealth } from '../../shared/types';

export const adminAdapter = {
  getOverview(): AdminOverviewMetrics {
    return {
      mrr: 0,
      creditsRevenue: 0,
      totalRevenue: 0,
      paymentFailures: [],
      planDistribution: [],
      activeTenants: 0,
      activeAgents: 0,
      aiMinutesUsed: 0,
      platformCallsHandled: 0,
      platformBookingsCreated: 0,
      platformConversionRate: 0,
      escalationRate: 0,
      usageAnomalies: [],
      churnRiskList: [],
    };
  },

  getTenants(): AdminTenantRow[] {
    return [];
  },

  getSystemHealth(): SystemHealth {
    return { status: 'ok', integrations: [] };
  },
};

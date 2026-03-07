/**
 * API admin adapter. Fetches admin overview from backend.
 */

import { api } from '../../lib/apiClient';
import type { AdminOverviewMetrics, AdminTenantRow, SystemHealth } from '../../shared/types';

const cache = {
  overview: null as AdminOverviewMetrics | null,
  tenants: null as AdminTenantRow[] | null,
  health: null as SystemHealth | null,
};

const defaultOverview: AdminOverviewMetrics = {
  mrr: 0, creditsRevenue: 0, totalRevenue: 0, paymentFailures: [],
  planDistribution: [], activeTenants: 0, activeAgents: 0,
  aiMinutesUsed: 0, platformCallsHandled: 0, platformBookingsCreated: 0,
  platformConversionRate: 0, escalationRate: 0,
  usageAnomalies: [], churnRiskList: [],
};

export const adminAdapter = {
  getOverview(): AdminOverviewMetrics {
    return cache.overview ?? defaultOverview;
  },

  getTenants(): AdminTenantRow[] {
    return cache.tenants ?? [];
  },

  getSystemHealth(): SystemHealth {
    return cache.health ?? { status: 'ok', integrations: [] };
  },

  async refresh(): Promise<void> {
    try {
      const [overview, health] = await Promise.all([
        api.get<any>('/admin/overview'),
        api.get<any>('/admin/system'),
      ]);
      cache.overview = { ...defaultOverview, ...overview };
      cache.health = health;
    } catch {
      // keep cache as-is
    }
  },
};

/**
 * Local calls adapter. Filters by tenantId for tenant isolation.
 * Optional dateRange filters by createdAt.
 */

import { seedCalls } from '../../mock/seedData';
import type { Call } from '../../shared/types';

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

function filterByDateRange<T extends { createdAt: string }>(items: T[], range?: DateRangeFilter): T[] {
  if (!range) return items;
  const startMs = range.start.getTime();
  const endMs = range.end.getTime() + 86400000; // end of day
  return items.filter((c) => {
    const ms = new Date(c.createdAt).getTime();
    return ms >= startMs && ms < endMs;
  });
}

function filterByAgent<T extends { agentId?: string }>(items: T[], agentId: string | undefined): T[] {
  if (!agentId) return items;
  return items.filter((x) => x.agentId === agentId);
}

export const callsAdapter = {
  async getCalls(
    tenantId: string | undefined,
    dateRange?: DateRangeFilter,
    agentId?: string,
  ): Promise<Call[]> {
    const byTenant = filterByTenant(seedCalls, tenantId);
    const byDate = filterByDateRange(byTenant, dateRange);
    return filterByAgent(byDate, agentId);
  },
  async getCallById(id: string, tenantId: string | undefined): Promise<Call | undefined> {
    const calls = filterByTenant(seedCalls, tenantId);
    return calls.find((c) => c.id === id);
  },
};

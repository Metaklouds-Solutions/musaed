/**
 * Local calls adapter. Filters by tenantId for tenant isolation.
 */

import { seedCalls } from '../../mock/seedData';
import type { Call } from '../../shared/types';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

export const callsAdapter = {
  getCalls(tenantId: string | undefined): Call[] {
    return filterByTenant(seedCalls, tenantId);
  },
  getCallById(id: string, tenantId: string | undefined): Call | undefined {
    const calls = filterByTenant(seedCalls, tenantId);
    return calls.find((c) => c.id === id);
  },
};

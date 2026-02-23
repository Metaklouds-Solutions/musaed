/**
 * Local customers adapter. Filters by tenantId for tenant isolation.
 */

import { seedCustomers } from '../../mock/seedData';
import type { Customer } from '../../shared/types';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

export const customersAdapter = {
  getCustomers(tenantId: string | undefined): Customer[] {
    return filterByTenant(seedCustomers, tenantId);
  },
  getCustomerById(id: string, tenantId: string | undefined): Customer | undefined {
    const customers = filterByTenant(seedCustomers, tenantId);
    return customers.find((c) => c.id === id);
  },
};

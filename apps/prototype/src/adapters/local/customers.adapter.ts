/**
 * Local customers adapter. Filters by tenantId for tenant isolation.
 */

import { seedCustomers } from '../../mock/seedData';
import { gdprAdapter } from './gdpr.adapter';
import type { Customer } from '../../shared/types';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

function excludeDeleted<T extends { id: string }>(items: T[]): T[] {
  const deleted = gdprAdapter.getDeletedCustomerIds();
  return items.filter((c) => !deleted.has(c.id));
}

export const customersAdapter = {
  getCustomers(tenantId: string | undefined): Customer[] {
    const byTenant = filterByTenant(seedCustomers, tenantId);
    return excludeDeleted(byTenant);
  },
  getCustomerById(id: string, tenantId: string | undefined): Customer | undefined {
    if (gdprAdapter.isCustomerDeleted(id)) return undefined;
    const customers = filterByTenant(seedCustomers, tenantId);
    return customers.find((c) => c.id === id);
  },
};

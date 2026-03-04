/**
 * API customers adapter (placeholder). Replace with real API when backend exists.
 */

import type { Customer } from '../../shared/types';

export const customersAdapter = {
  getCustomers(_tenantId: string | undefined): Customer[] {
    return [];
  },
  getCustomerById(_id: string, _tenantId: string | undefined): Customer | undefined {
    return undefined;
  },
};

/**
 * API customers adapter. Fetches from backend, serves cached data synchronously.
 */

import { api } from '../../lib/apiClient';
import type { Customer } from '../../shared/types';

let cachedCustomers: Customer[] = [];

export const customersAdapter = {
  getCustomers(_tenantId: string | undefined): Customer[] {
    return cachedCustomers;
  },

  getCustomerById(id: string, _tenantId: string | undefined): Customer | undefined {
    return cachedCustomers.find((c) => c.id === id);
  },

  async refresh(): Promise<void> {
    try {
      cachedCustomers = await api.get<Customer[]>('/tenant/customers');
    } catch {
      // keep cache as-is
    }
  },

  async create(data: Partial<Customer>): Promise<Customer | null> {
    try {
      const created = await api.post<Customer>('/tenant/customers', data);
      cachedCustomers = [...cachedCustomers, created];
      return created;
    } catch {
      return null;
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await api.delete(`/tenant/customers/${id}`);
      cachedCustomers = cachedCustomers.filter((c) => c.id !== id);
      return true;
    } catch {
      return false;
    }
  },

  async exportGdpr(id: string): Promise<unknown> {
    return api.get(`/tenant/customers/${id}/export`);
  },
};

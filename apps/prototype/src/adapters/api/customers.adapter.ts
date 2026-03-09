/**
 * API customers adapter. Fetches from backend.
 */

import { api } from '../../lib/apiClient';
import type { Customer } from '../../shared/types';

function mapCustomer(c: any): Customer {
  return {
    id: c._id,
    tenantId: c.tenantId,
    name: c.name,
    email: c.email ?? '',
  };
}

export const customersAdapter = {
  async getCustomers(tenantId: string | undefined, filters?: { search?: string }): Promise<Customer[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.search) params.search = filters.search;
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: any[] }>(`/tenant/customers?${qs}`);
      return (resp.data ?? []).map(mapCustomer);
    } catch {
      return [];
    }
  },

  async getCustomerById(id: string, tenantId: string | undefined): Promise<Customer | undefined> {
    try {
      const resp = await api.get<any>(`/tenant/customers/${id}`);
      const c = resp.customer ?? resp;
      return mapCustomer(c);
    } catch {
      return undefined;
    }
  },

  async create(data: Partial<Customer>): Promise<Customer | null> {
    try {
      const created = await api.post<any>('/tenant/customers', data);
      return mapCustomer(created);
    } catch {
      return null;
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await api.delete(`/tenant/customers/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async exportGdpr(id: string): Promise<unknown> {
    return api.get(`/tenant/customers/${id}/export`);
  },
};

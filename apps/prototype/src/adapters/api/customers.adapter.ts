/**
 * API customers adapter. Fetches from backend.
 */

import { api } from '../../lib/apiClient';
import type { Customer } from '../../shared/types';

function withTenantScope(path: string, tenantId?: string): string {
  if (!tenantId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenantId=${encodeURIComponent(tenantId)}`;
}

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
    if (!tenantId) return [];
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.search) params.search = filters.search;
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: any[] }>(withTenantScope(`/tenant/customers?${qs}`, tenantId));
      return (resp.data ?? []).map(mapCustomer);
    } catch {
      return [];
    }
  },

  async getCustomerById(id: string, tenantId: string | undefined): Promise<Customer | undefined> {
    try {
      const resp = await api.get<any>(withTenantScope(`/tenant/customers/${id}`, tenantId));
      const c = resp.customer ?? resp;
      return mapCustomer(c);
    } catch {
      return undefined;
    }
  },

  async create(data: Partial<Customer> & { tenantId?: string }): Promise<Customer | null> {
    try {
      const created = await api.post<any>(
        withTenantScope('/tenant/customers', data.tenantId),
        data,
      );
      return mapCustomer(created);
    } catch {
      return null;
    }
  },

  async deleteCustomer(id: string, tenantId?: string): Promise<boolean> {
    try {
      await api.delete(withTenantScope(`/tenant/customers/${id}`, tenantId));
      return true;
    } catch {
      return false;
    }
  },

  async exportGdpr(id: string, tenantId?: string): Promise<unknown> {
    return api.get(withTenantScope(`/tenant/customers/${id}/export`, tenantId));
  },
};

/**
 * GDPR flows backed by auth and tenant customer APIs (no localStorage tombstones).
 */

import { api } from '../../lib/apiClient';
import type { User } from '../../shared/types';

function withTenantScope(path: string, tenantId?: string): string {
  if (!tenantId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenantId=${encodeURIComponent(tenantId)}`;
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const gdprAdapter = {
  isCustomerDeleted(_customerId: string): boolean {
    return false;
  },

  getDeletedCustomerIds(): Set<string> {
    return new Set();
  },

  async exportUserData(user: User): Promise<void> {
    const data = await api.get<Record<string, unknown>>('/auth/me');
    downloadJson(`my-data-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      type: 'user_data_export',
      user: data,
    });
  },

  async exportCustomerData(customerId: string, tenantId: string | undefined): Promise<void> {
    const data = await api.get<unknown>(
      withTenantScope(`/tenant/customers/${customerId}/export`, tenantId),
    );
    downloadJson(
      `customer-${customerId}-${new Date().toISOString().slice(0, 10)}.json`,
      {
        exportedAt: new Date().toISOString(),
        type: 'customer_data_export',
        data,
      },
    );
  },

  async deleteUserData(_userId: string, onLogout: () => void): Promise<void> {
    await api.delete('/auth/me');
    onLogout();
  },

  async deleteCustomerData(customerId: string, tenantId: string | undefined): Promise<void> {
    await api.delete(withTenantScope(`/tenant/customers/${customerId}`, tenantId));
  },
};

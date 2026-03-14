/**
 * API audit adapter. Fetches audit entries from backend.
 */

import { api } from '../../lib/apiClient';

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  tenantId?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export const auditAdapter = {
  async getRecent(limit = 50, tenantId?: string): Promise<AuditEntry[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (tenantId) params.set('tenantId', tenantId);
      const data = await api.get<AuditEntry[]>(`/admin/audit?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getByTenant(tenantId: string, limit = 50): Promise<AuditEntry[]> {
    return this.getRecent(limit, tenantId);
  },

  log(_action: string, _meta?: Record<string, unknown>, _userId?: string, _tenantId?: string): void {
    // Audit log is written by backend; no client-side log
  },
};

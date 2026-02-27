/**
 * Audit log adapter. Logs key admin actions for compliance and debugging.
 */

import { seedAuditLog } from '../../mock/seedData';

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  tenantId?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/** In-memory audit entries (seed + runtime). */
const entries: AuditEntry[] = [...seedAuditLog];

export const auditAdapter = {
  /** Log an action. */
  log(action: string, meta?: Record<string, unknown>, userId = 'admin', tenantId?: string): void {
    entries.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      action,
      userId,
      tenantId,
      meta,
      timestamp: new Date().toISOString(),
    });
  },

  /** Get recent entries (newest first). */
  getRecent(limit = 100): AuditEntry[] {
    return [...entries].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)).slice(0, limit);
  },

  /** Get entries filtered by tenant. */
  getByTenant(tenantId: string, limit = 50): AuditEntry[] {
    return entries
      .filter((e) => e.tenantId === tenantId)
      .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
      .slice(0, limit);
  },
};

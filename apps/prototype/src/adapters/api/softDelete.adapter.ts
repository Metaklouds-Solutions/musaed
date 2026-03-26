/**
 * Archive/delete flows use real tenant APIs (no client-side tombstone sets).
 */

import { tenantsAdapter } from './tenants.adapter';

/** Kept for parity with local adapter event name (unused in API mode). */
export const SOFT_DELETE_CHANGED = 'clinic-crm-soft-delete-changed';

export const softDeleteAdapter = {
  isTenantDeleted(): boolean {
    return false;
  },

  isStaffDeleted(): boolean {
    return false;
  },

  getDeletedTenantIds(): Set<string> {
    return new Set();
  },

  getDeletedStaffKeys(): Set<string> {
    return new Set();
  },

  async softDeleteTenant(tenantId: string): Promise<void> {
    await tenantsAdapter.deleteTenant(tenantId);
  },

  softDeleteStaff(_userId: string, _tenantId: string): void {
    /* Staff removal uses tenant staff API from Staff UI — not bulk soft-delete */
  },

  restoreTenant(_tenantId: string): void {
    /* Restoration requires backend support */
  },

  restoreStaff(_userId: string, _tenantId: string): void {
    /* Restoration requires backend support */
  },
};

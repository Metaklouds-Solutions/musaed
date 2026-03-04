/**
 * Soft delete adapter. Tenants and staff are marked deleted (localStorage).
 * Deleted items are filtered from lists; can be restored later.
 */

const DELETED_TENANTS_KEY = 'clinic-crm-soft-delete-tenants';
const DELETED_STAFF_KEY = 'clinic-crm-soft-delete-staff';

export const SOFT_DELETE_CHANGED = 'clinic-crm-soft-delete-changed';

function parseStringArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function getDeletedTenantIds(): Set<string> {
  const stored = localStorage.getItem(DELETED_TENANTS_KEY);
  return new Set(stored ? parseStringArray(stored) : []);
}

function getDeletedStaffKeys(): Set<string> {
  const stored = localStorage.getItem(DELETED_STAFF_KEY);
  return new Set(stored ? parseStringArray(stored) : []);
}

/** Key for staff: userId::tenantId (same user can be in multiple tenants). */
function staffKey(userId: string, tenantId: string): string {
  return `${userId}::${tenantId}`;
}

export const softDeleteAdapter = {
  isTenantDeleted(tenantId: string): boolean {
    return getDeletedTenantIds().has(tenantId);
  },

  isStaffDeleted(userId: string, tenantId: string): boolean {
    return getDeletedStaffKeys().has(staffKey(userId, tenantId));
  },

  getDeletedTenantIds(): Set<string> {
    return getDeletedTenantIds();
  },

  getDeletedStaffKeys(): Set<string> {
    return getDeletedStaffKeys();
  },

  softDeleteTenant(tenantId: string): void {
    const ids = getDeletedTenantIds();
    ids.add(tenantId);
    localStorage.setItem(DELETED_TENANTS_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent(SOFT_DELETE_CHANGED));
  },

  softDeleteStaff(userId: string, tenantId: string): void {
    const keys = getDeletedStaffKeys();
    keys.add(staffKey(userId, tenantId));
    localStorage.setItem(DELETED_STAFF_KEY, JSON.stringify([...keys]));
    window.dispatchEvent(new CustomEvent(SOFT_DELETE_CHANGED));
  },

  restoreTenant(tenantId: string): void {
    const ids = getDeletedTenantIds();
    ids.delete(tenantId);
    localStorage.setItem(DELETED_TENANTS_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent(SOFT_DELETE_CHANGED));
  },

  restoreStaff(userId: string, tenantId: string): void {
    const keys = getDeletedStaffKeys();
    keys.delete(staffKey(userId, tenantId));
    localStorage.setItem(DELETED_STAFF_KEY, JSON.stringify([...keys]));
    window.dispatchEvent(new CustomEvent(SOFT_DELETE_CHANGED));
  },
};

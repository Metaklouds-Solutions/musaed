/**
 * Session and user types for auth. Roles align with data model (04-data-model-v1.md).
 * System-level Role for guards; TenantRoleSlug for tenant-scoped permissions.
 */

/** System-level role for route guards (Admin vs Tenant portal). */
export type Role = 'ADMIN' | 'TENANT_OWNER' | 'STAFF';

/** Tenant-scoped role from tenant_memberships.roleSlug. */
export type TenantRoleSlug =
  | 'tenant_owner'
  | 'clinic_admin'
  | 'receptionist'
  | 'doctor'
  | 'auditor'
  | 'tenant_staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Set for TENANT_OWNER and STAFF: the tenant this user belongs to. */
  tenantId?: string;
  /** Tenant-scoped role (from tenant_memberships). Used for feature-level permissions. */
  tenantRole?: TenantRoleSlug;
}

export interface Session {
  user: User;
}

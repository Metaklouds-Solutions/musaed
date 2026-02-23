/**
 * Session and user types for auth. Roles align with data model (04-data-model-v1.md).
 */

export type Role = 'ADMIN' | 'TENANT_OWNER' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Set for TENANT_OWNER and STAFF: the tenant this user belongs to. */
  tenantId?: string;
}

export interface Session {
  user: User;
}

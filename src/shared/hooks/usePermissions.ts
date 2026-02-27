/**
 * Feature-level permissions based on user role and tenantRole.
 * Use for conditional UI (e.g. run_events visible only to auditor).
 */

import { useMemo } from 'react';
import { useSession } from '../../app/session/SessionContext';
import type { User } from '../types';

export interface Permissions {
  /** Can view run events / debug console (auditor only within tenant; admin always). */
  canAccessRunEvents: boolean;
  /** Can assign tickets to staff (admin, clinic_admin, tenant_owner). */
  canAssignTickets: boolean;
}

/**
 * Returns feature-level permissions for the current user.
 * ADMIN has full access. Tenant users get permissions from tenantRole.
 */
export function usePermissions(): Permissions {
  const { user } = useSession();
  return useMemo(() => computePermissions(user), [user]);
}

/**
 * Compute permissions for a user. Use when user is passed as prop.
 */
export function computePermissions(user: User | null): Permissions {
  if (!user) {
    return { canAccessRunEvents: false, canAssignTickets: false };
  }
  if (user.role === 'ADMIN') {
    return { canAccessRunEvents: true, canAssignTickets: true };
  }
  // Tenant users: permissions from tenantRole
  const tenantRole = user.tenantRole;
  return {
    canAccessRunEvents: tenantRole === 'auditor',
    canAssignTickets:
      tenantRole === 'tenant_owner' ||
      tenantRole === 'clinic_admin' ||
      tenantRole === 'auditor',
  };
}

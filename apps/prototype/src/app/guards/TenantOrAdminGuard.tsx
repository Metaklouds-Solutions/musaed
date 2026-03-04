/**
 * Allows both ADMIN and tenant users (TENANT_OWNER, STAFF).
 * Tenant users must have tenantId. Redirects unauthenticated to login.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

const TENANT_ROLES = ['TENANT_OWNER', 'STAFF'] as const;

export function TenantOrAdminGuard() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Outlet />;
  if (TENANT_ROLES.includes(user.role as (typeof TENANT_ROLES)[number])) {
    if (!user.tenantId) {
      return <Navigate to="/login" replace state={{ message: 'No tenant assigned. Contact your administrator.' }} />;
    }
    return <Outlet />;
  }
  return <Navigate to="/login" replace />;
}

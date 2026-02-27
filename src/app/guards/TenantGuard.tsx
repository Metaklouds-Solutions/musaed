/**
 * Allows TENANT_OWNER and STAFF only. Requires tenantId for tenant users.
 * Redirects ADMIN to /admin/overview. Redirects tenant users without tenantId to login.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

const TENANT_ROLES = ['TENANT_OWNER', 'STAFF'] as const;

export function TenantGuard() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (!TENANT_ROLES.includes(user.role as (typeof TENANT_ROLES)[number])) {
    return <Navigate to="/admin/overview" replace />;
  }
  // Tenant users must have tenantId assigned (from tenant_memberships).
  if (!user.tenantId) {
    return <Navigate to="/login" replace state={{ message: 'No tenant assigned. Contact your administrator.' }} />;
  }
  return <Outlet />;
}

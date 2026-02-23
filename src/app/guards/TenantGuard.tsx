/**
 * Allows TENANT_OWNER and STAFF only. Redirects ADMIN to /admin/overview.
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
  return <Outlet />;
}

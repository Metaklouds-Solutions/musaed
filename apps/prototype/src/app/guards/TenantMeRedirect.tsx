/**
 * Redirects /tenants/me to the current user's tenant detail.
 * For tenant users: /tenants/:tenantId
 * For admin: /admin/tenants (no "me" concept)
 */

import { Navigate } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

export function TenantMeRedirect() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/tenants" replace />;
  if (!user.tenantId) {
    return <Navigate to="/login" replace state={{ message: 'No tenant assigned. Contact your administrator.' }} />;
  }
  return <Navigate to={`/tenants/${user.tenantId}`} replace />;
}

/**
 * Ensures tenant users can only access their own tenant.
 * When on /tenants/:id or /tenants/:id/agents/:agentId, tenant users must have id === user.tenantId.
 * Admin users can access any tenant.
 */

import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

export function TenantScopeGuard() {
  const { user } = useSession();
  const { id } = useParams<{ id: string }>();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Outlet />;
  if (user.role !== 'ADMIN' && user.tenantId && id && id !== user.tenantId) {
    return <Navigate to={`/tenants/${user.tenantId}`} replace />;
  }
  return <Outlet />;
}

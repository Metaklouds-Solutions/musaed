/**
 * Redirects from / to role-appropriate default: ADMIN → /admin/overview, tenant → /dashboard.
 */

import { Navigate } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

export function DefaultRedirect() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/overview" replace />;
  return <Navigate to="/dashboard" replace />;
}

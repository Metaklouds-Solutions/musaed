/**
 * Allows ADMIN only. Redirects tenant roles to /dashboard.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

export function AdminGuard() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

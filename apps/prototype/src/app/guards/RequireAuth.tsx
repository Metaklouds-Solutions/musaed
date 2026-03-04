/**
 * Redirects to /login if not authenticated. Otherwise renders outlet.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

export function RequireAuth() {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

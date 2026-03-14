/**
 * Redirects to /login if not authenticated. Waits for session restoration on reload.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session/SessionContext';

export function RequireAuth() {
  const { isAuthenticated, restoring } = useSession();

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

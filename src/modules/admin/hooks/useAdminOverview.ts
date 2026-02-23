/**
 * Admin overview hook. Adapters only; no tenant filter (platform-wide).
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { adminAdapter } from '../../../adapters';

export function useAdminOverview() {
  const { user } = useSession();
  const metrics = useMemo(() => adminAdapter.getOverview(), []);
  const isAdmin = user?.role === 'ADMIN';
  return { user, isAdmin, metrics };
}

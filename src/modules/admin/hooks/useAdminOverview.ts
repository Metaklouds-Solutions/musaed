/**
 * Admin overview hook. Adapters only; no tenant filter (platform-wide).
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { adminAdapter } from '../../../adapters';

/** Returns admin overview dashboard aggregates and role-gated session state. */
export function useAdminOverview() {
  const { user } = useSession();
  const metrics = useMemo(() => adminAdapter.getOverview(), []);
  const kpis = useMemo(() => adminAdapter.getAdminKpis(), []);
  const recentTenants = useMemo(() => adminAdapter.getRecentTenants(5), []);
  const supportSnapshot = useMemo(() => adminAdapter.getSupportSnapshot(), []);
  const recentCalls = useMemo(() => adminAdapter.getRecentCalls(10), []);
  const systemHealth = useMemo(() => adminAdapter.getSystemHealthExtended(), []);
  const isAdmin = user?.role === 'ADMIN';
  return {
    user,
    isAdmin,
    metrics,
    kpis,
    recentTenants,
    supportSnapshot,
    recentCalls,
    systemHealth,
  };
}

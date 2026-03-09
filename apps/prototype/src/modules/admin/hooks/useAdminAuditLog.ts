import { useMemo } from 'react';
import { auditAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

/** Admin audit log hook with tenant name lookup map. */
export function useAdminAuditLog() {
  const entries = useMemo(() => auditAdapter.getRecent(50), []);
  const { data: allTenants } = useAsyncData(() => tenantsAdapter.getAllTenants(), [], []);

  const tenantNames = useMemo(() => {
    const m = new Map<string, string>();
    allTenants.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [allTenants]);

  return { entries, tenantNames };
}

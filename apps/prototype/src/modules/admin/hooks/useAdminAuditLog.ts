import { useMemo } from 'react';
import { auditAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

/** Admin audit log hook with tenant name lookup map. */
export function useAdminAuditLog(tenantId?: string) {
  const { data: entries = [] } = useAsyncData(
    () => (tenantId ? auditAdapter.getByTenant(tenantId, 50) : auditAdapter.getRecent(50)),
    [tenantId],
    [],
  );
  const { data: allTenants } = useAsyncData(() => tenantsAdapter.getAllTenants(), [], []);

  const tenantNames = useMemo(() => {
    const m = new Map<string, string>();
    allTenants.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [allTenants]);

  return { entries, tenantNames };
}

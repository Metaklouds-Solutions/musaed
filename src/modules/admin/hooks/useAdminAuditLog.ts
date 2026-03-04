import { useMemo } from 'react';
import { auditAdapter, tenantsAdapter } from '../../../adapters';

/** Admin audit log hook with tenant name lookup map. */
export function useAdminAuditLog() {
  const entries = useMemo(() => auditAdapter.getRecent(50), []);
  const tenantNames = useMemo(() => {
    const m = new Map<string, string>();
    tenantsAdapter.getAllTenants().forEach((t) => m.set(t.id, t.name));
    return m;
  }, []);

  return { entries, tenantNames };
}

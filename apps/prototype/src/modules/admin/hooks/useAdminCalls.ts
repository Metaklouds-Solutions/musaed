import { useMemo } from 'react';
import { tenantsAdapter } from '../../../adapters';

/** Admin calls helpers hook for tenant-name lookup and filter option generation. */
export function useAdminCalls() {
  const tenantMap = useMemo(() => {
    const m = new Map<string, string>();
    tenantsAdapter.getAllTenants().forEach((t) => m.set(t.id, t.name));
    return m;
  }, []);

  return { tenantMap };
}

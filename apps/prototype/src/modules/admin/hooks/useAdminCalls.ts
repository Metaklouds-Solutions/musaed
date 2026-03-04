import { useMemo, useCallback } from 'react';
import { tenantsAdapter, exportAdapter } from '../../../adapters';

/** Admin calls helpers hook for tenant-name lookup and filter option generation. */
export function useAdminCalls() {
  const tenantMap = useMemo(() => {
    const m = new Map<string, string>();
    tenantsAdapter.getAllTenants().forEach((t) => m.set(t.id, t.name));
    return m;
  }, []);

  const exportCallsCsv = useCallback((rows: Record<string, string>[], fileName: string) => {
    exportAdapter.exportCsv(rows, fileName);
  }, []);

  return { tenantMap, exportCallsCsv };
}

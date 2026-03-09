import { useMemo, useCallback } from 'react';
import { tenantsAdapter, exportAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

/** Admin calls helpers hook for tenant-name lookup and filter option generation. */
export function useAdminCalls() {
  const { data: allTenants } = useAsyncData(() => tenantsAdapter.getAllTenants(), [], []);

  const tenantMap = useMemo(() => {
    const m = new Map<string, string>();
    allTenants.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [allTenants]);

  const exportCallsCsv = useCallback((rows: Record<string, string>[], fileName: string) => {
    exportAdapter.exportCsv(rows, fileName);
  }, []);

  return { tenantMap, exportCallsCsv };
}

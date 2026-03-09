import { useMemo } from 'react';
import { runsAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

/** Admin run detail hook for run, events, and tenant label lookup. */
export function useAdminRunDetail(runId?: string) {
  const run = useMemo(() => (runId ? runsAdapter.getRun(runId) : null), [runId]);
  const events = useMemo(() => (runId ? runsAdapter.getRunEvents(runId) : []), [runId]);
  const { data: allTenants } = useAsyncData(() => tenantsAdapter.getAllTenants(), [], []);

  const tenantName = useMemo(() => {
    if (!run) return '';
    return allTenants.find((t) => t.id === run.tenantId)?.name ?? run.tenantId;
  }, [run, allTenants]);

  return { run, events, tenantName };
}

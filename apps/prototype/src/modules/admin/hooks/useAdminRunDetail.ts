import { useMemo } from 'react';
import { runsAdapter, tenantsAdapter } from '../../../adapters';

/** Admin run detail hook for run, events, and tenant label lookup. */
export function useAdminRunDetail(runId?: string) {
  const run = useMemo(() => (runId ? runsAdapter.getRun(runId) : null), [runId]);
  const events = useMemo(() => (runId ? runsAdapter.getRunEvents(runId) : []), [runId]);
  const tenantName = useMemo(() => {
    if (!run) return '';
    return tenantsAdapter.getAllTenants().find((t) => t.id === run.tenantId)?.name ?? run.tenantId;
  }, [run]);

  return { run, events, tenantName };
}

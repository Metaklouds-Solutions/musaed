import { useMemo } from 'react';
import { runsAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AgentRun, RunEvent } from '../../../shared/types/entities';

/** Admin run detail hook for run, events, and tenant label lookup. */
export function useAdminRunDetail(runId?: string) {
  const { data: run, error: runError } = useAsyncData(
    () => (runId ? runsAdapter.getRun(runId) : Promise.resolve(null)),
    [runId],
    null as AgentRun | null,
  );
  const { data: events, error: eventsError } = useAsyncData(
    () => (runId ? runsAdapter.getRunEvents(runId) : Promise.resolve([])),
    [runId],
    [] as RunEvent[],
  );
  const { data: allTenants } = useAsyncData(() => tenantsAdapter.getAllTenants(), [], []);

  const tenantName = useMemo(() => {
    if (!run) return '';
    return allTenants.find((t) => t.id === run.tenantId)?.name ?? run.tenantId;
  }, [run, allTenants]);

  return { run, events, tenantName, runError, eventsError };
}

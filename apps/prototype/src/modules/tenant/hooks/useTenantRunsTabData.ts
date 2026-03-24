import { useParams } from 'react-router-dom';
import { runsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminRunRow } from '../../../adapters/local/runs.adapter';

/** Tenant runs tab data hook. Fetches agent runs for the current tenant. */
export function useTenantRunsTabData() {
  const { id } = useParams<{ id: string }>();
  const tenantId = id ?? undefined;

  const { data: runs, loading, error } = useAsyncData(
    () => runsAdapter.listRuns(tenantId),
    [tenantId],
    [] as AdminRunRow[],
  );

  return { runs, loading, error };
}

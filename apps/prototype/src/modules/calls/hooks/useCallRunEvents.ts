/**
 * Returns run metadata/events for a call when auditor visibility is enabled.
 * Uses Retell callId for run lookup (call.callId ?? call.id).
 */

import { runsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AgentRun, RunEvent } from '../../../shared/types/entities';

/** Returns run metadata/events for a call when auditor visibility is enabled. */
export function useCallRunEvents(
  retellCallId: string | undefined,
  tenantId: string | undefined,
  enabled: boolean,
) {
  const { data: run } = useAsyncData(
    () =>
      retellCallId && enabled
        ? runsAdapter.getRunByCallId(retellCallId, tenantId)
        : Promise.resolve(null),
    [retellCallId, tenantId, enabled],
    null as AgentRun | null,
  );

  const { data: events } = useAsyncData(
    () =>
      run ? runsAdapter.getRunEvents(run.id, tenantId) : Promise.resolve([]),
    [run?.id, tenantId],
    [] as RunEvent[],
  );

  return { run, events };
}

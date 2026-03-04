import { useMemo } from 'react';
import { runsAdapter } from '../../../adapters';

/** Returns run metadata/events for a call when auditor visibility is enabled. */
export function useCallRunEvents(
  callId: string | undefined,
  tenantId: string | undefined,
  enabled: boolean
) {
  const run = useMemo(
    () => (callId && enabled ? runsAdapter.getRunByCallId(callId, tenantId) : null),
    [callId, tenantId, enabled]
  );
  const events = useMemo(
    () => (run ? runsAdapter.getRunEvents(run.id) : []),
    [run]
  );
  return { run, events };
}

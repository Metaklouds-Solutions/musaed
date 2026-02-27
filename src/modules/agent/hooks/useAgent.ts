/**
 * Tenant agent hook. Uses agents adapter.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { agentsAdapter } from '../../../adapters/local/agents.adapter';

export function useAgent() {
  const { user } = useSession();
  const tenantId = user?.tenantId ?? undefined;

  const agent = useMemo(
    () => agentsAdapter.getAgentForTenant(tenantId),
    [tenantId]
  );

  return { agent, tenantId };
}

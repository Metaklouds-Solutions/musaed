import { useMemo } from 'react';
import { agentsAdapter } from '../../../adapters';

/** Resolves redirect target for admin agent route based on assignment. */
export function useAdminAgentRedirect(agentId?: string) {
  return useMemo(() => {
    if (!agentId) return '/admin/agents';
    const agent = agentsAdapter.getDetails(agentId);
    if (agent?.tenantId) return `/admin/tenants/${agent.tenantId}/agents/${agentId}`;
    return '/admin/agents';
  }, [agentId]);
}

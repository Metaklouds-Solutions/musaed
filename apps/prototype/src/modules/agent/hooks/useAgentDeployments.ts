/**
 * Fetches channel deployment summaries for a given agent instance.
 *
 * @param agentId - The agent instance ID to fetch deployments for
 * @returns Deployment list, loading state, error, and refetch callback
 */

import { agentsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { ChannelDeploymentSummary } from '../../../shared/types';

export function useAgentDeployments(agentId: string | undefined) {
  const { data: deployments, loading, error, refetch } = useAsyncData<ChannelDeploymentSummary[]>(
    async () => {
      if (!agentId) return [];
      return agentsAdapter.getTenantDeployments(agentId);
    },
    [agentId],
    [],
  );

  return { deployments, loading, error, refetch };
}

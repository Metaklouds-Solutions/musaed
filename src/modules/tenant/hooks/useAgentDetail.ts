/**
 * Agent detail hook. Uses agentsAdapter.getAgentDetailFull.
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { agentsAdapter } from '../../../adapters';
import type { AgentDetailFull } from '../../../shared/types';

export function useAgentDetail(): {
  agent: AgentDetailFull | null;
  tenantId: string | null;
  agentId: string | null;
  isLoading: boolean;
} {
  const { id, agentId } = useParams<{ id: string; agentId: string }>();
  const agent = useMemo(() => {
    if (!id || !agentId) return null;
    return agentsAdapter.getAgentDetailFull(id, agentId);
  }, [id, agentId]);
  return {
    agent,
    tenantId: id ?? null,
    agentId: agentId ?? null,
    isLoading: false,
  };
}

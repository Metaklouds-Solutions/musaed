/**
 * Agent detail hook. Fetches agent via agentsAdapter.getAgentDetailFullAsync.
 */

import { useEffect, useState } from 'react';
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
  const [agent, setAgent] = useState<AgentDetailFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agentId) {
      setAgent(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    agentsAdapter
      .getAgentDetailFullAsync(id ?? undefined, agentId)
      .then((data) => {
        if (!cancelled) {
          setAgent(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAgent(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, agentId]);

  return {
    agent,
    tenantId: id ?? null,
    agentId: agentId ?? null,
    isLoading,
  };
}

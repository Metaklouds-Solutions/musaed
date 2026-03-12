import { useEffect, useState } from 'react';
import { agentsAdapter } from '../../../adapters';

/** Resolves redirect target for admin agent route by fetching agent. Handles 401 by redirecting to list. */
export function useAdminAgentRedirect(agentId?: string): {
  targetPath: string | null;
  loading: boolean;
} {
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(agentId));

  useEffect(() => {
    if (!agentId) {
      setTargetPath('/admin/agents');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    agentsAdapter
      .getAgentForRedirect(agentId)
      .then((agent) => {
        if (cancelled) return;
        if (agent?.tenantId) {
          setTargetPath(`/admin/tenants/${agent.tenantId}/agents/${agentId}`);
        } else {
          setTargetPath('/admin/agents');
        }
      })
      .catch(() => {
        if (!cancelled) setTargetPath('/admin/agents');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return { targetPath, loading };
}

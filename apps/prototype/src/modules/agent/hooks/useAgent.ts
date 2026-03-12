/**
 * Tenant agent hook. Uses agents adapter.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { agentsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { TenantAgentDetail } from '../../../shared/types';

export function useAgent() {
  const { user } = useSession();
  const tenantId = user?.tenantId ?? undefined;

  const { data: agent, loading } = useAsyncData<TenantAgentDetail | null>(
    async () => {
      if (!tenantId) return null;
      const agents = await Promise.resolve(agentsAdapter.getAgentsForTenant(tenantId));
      const first = agents[0];
      if (!first) return null;
      return {
        id: first.id,
        voice: first.voice,
        language: first.language,
        status:
          first.status === 'active' ? 'active' : first.status === 'paused' ? 'paused' : 'archived',
        lastSyncedAt: first.lastSynced === '—' ? new Date().toISOString() : first.lastSynced,
        enabledSkills: [],
      };
    },
    [tenantId],
    null,
  );

  return { agent, tenantId, loading };
}

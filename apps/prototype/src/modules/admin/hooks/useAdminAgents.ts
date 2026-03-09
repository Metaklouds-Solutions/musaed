import { useState, useMemo, useCallback } from 'react';
import { adminAdapter, agentsAdapter, auditAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminAgentRow } from '../../../shared/types';

/** Admin agents data hook with filtering and tenant assignment actions. */
export function useAdminAgents() {
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: agents, loading, refetch } = useAsyncData(
    () => agentsAdapter.list(),
    [refreshKey],
    [] as AdminAgentRow[],
  );

  const { data: tenants } = useAsyncData(() => adminAdapter.getTenants(), [], []);

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (tenantFilter) list = list.filter((a) => a.tenantId === tenantFilter);
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    return list;
  }, [agents, tenantFilter, statusFilter]);

  const assignAgent = useCallback(
    (agent: AdminAgentRow, tenantId: string) => {
      agentsAdapter.assign(agent.id, tenantId);
      auditAdapter.log('agent.assigned', { agentId: agent.id, agentName: agent.name, tenantId });
      setRefreshKey((k) => k + 1);
    },
    []
  );

  return {
    tenants,
    filteredAgents,
    loading,
    tenantFilter,
    setTenantFilter,
    statusFilter,
    setStatusFilter,
    assignAgent,
    refetch,
  };
}

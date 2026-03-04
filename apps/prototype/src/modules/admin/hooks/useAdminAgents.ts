import { useState, useMemo, useCallback } from 'react';
import { adminAdapter, agentsAdapter, auditAdapter } from '../../../adapters';
import type { AdminAgentRow } from '../../../shared/types';

/** Admin agents data hook with filtering and tenant assignment actions. */
export function useAdminAgents() {
  const [agents, setAgents] = useState<AdminAgentRow[]>(() => agentsAdapter.list());
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const tenants = useMemo(() => adminAdapter.getTenants(), []);

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (tenantFilter) list = list.filter((a) => a.tenantId === tenantFilter);
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    return list;
  }, [agents, tenantFilter, statusFilter]);

  const refetch = useCallback(() => setAgents(agentsAdapter.list()), []);

  const assignAgent = useCallback(
    (agent: AdminAgentRow, tenantId: string) => {
      agentsAdapter.assign(agent.id, tenantId);
      auditAdapter.log('agent.assigned', { agentId: agent.id, agentName: agent.name, tenantId });
      refetch();
    },
    [refetch]
  );

  return {
    tenants,
    filteredAgents,
    tenantFilter,
    setTenantFilter,
    statusFilter,
    setStatusFilter,
    assignAgent,
  };
}

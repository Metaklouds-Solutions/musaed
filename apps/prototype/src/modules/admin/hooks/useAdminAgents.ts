import { useState, useMemo, useCallback } from 'react';
import { adminAdapter, agentsAdapter, auditAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminAgentRow, ChannelDeploymentSummary } from '../../../shared/types';
import { ApiClientError } from '../../../lib/apiClient';

function mapApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 0) {
      return 'Cannot reach backend API. Please check server status and retry.';
    }
    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and retry.';
    }
    return error.message || 'Request failed';
  }
  return error instanceof Error ? error.message : 'Request failed';
}

/** Admin agents data hook with filtering and tenant assignment actions. */
export function useAdminAgents() {
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deployingAgentId, setDeployingAgentId] = useState<string | null>(null);
  const [deploymentsLoadingFor, setDeploymentsLoadingFor] = useState<string | null>(null);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);
  const [selectedDeploymentsAgentId, setSelectedDeploymentsAgentId] = useState<string | null>(null);
  const [deploymentsByAgentId, setDeploymentsByAgentId] = useState<
    Record<string, ChannelDeploymentSummary[]>
  >({});

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
    async (agent: AdminAgentRow, tenantId: string) => {
      await agentsAdapter.assign(agent.id, tenantId);
      auditAdapter.log('agent.assigned', { agentId: agent.id, agentName: agent.name, tenantId });
      setRefreshKey((k) => k + 1);
    },
    []
  );

  const loadDeployments = useCallback(async (agentId: string) => {
    if (deploymentsLoadingFor === agentId) {
      return deploymentsByAgentId[agentId] ?? [];
    }
    setDeploymentsError(null);
    setDeploymentsLoadingFor(agentId);
    setSelectedDeploymentsAgentId(agentId);
    try {
      const deployments = await agentsAdapter.getDeployments(agentId);
      setDeploymentsByAgentId((prev) => ({ ...prev, [agentId]: deployments }));
      return deployments;
    } catch (error: unknown) {
      const message = mapApiErrorMessage(error);
      setDeploymentsError(message);
      return [];
    } finally {
      setDeploymentsLoadingFor(null);
    }
  }, [deploymentsByAgentId, deploymentsLoadingFor]);

  const deployAgent = useCallback(async (agent: AdminAgentRow) => {
    if (deployingAgentId === agent.id) {
      throw new Error('Deployment already in progress for this agent');
    }
    setDeployingAgentId(agent.id);
    try {
      const result = await agentsAdapter.deploy(agent.id);
      auditAdapter.log('agent.deployment_queued', {
        agentId: agent.id,
        agentName: agent.name,
        tenantId: agent.tenantId,
        status: result.status ?? 'queued',
      });
      await loadDeployments(agent.id);
      setRefreshKey((k) => k + 1);
      return result;
    } catch (error: unknown) {
      throw new Error(mapApiErrorMessage(error));
    } finally {
      setDeployingAgentId(null);
    }
  }, [deployingAgentId, loadDeployments]);

  return {
    tenants,
    filteredAgents,
    loading,
    tenantFilter,
    setTenantFilter,
    statusFilter,
    setStatusFilter,
    assignAgent,
    deployAgent,
    loadDeployments,
    deploymentsByAgentId,
    deploymentsError,
    selectedDeploymentsAgentId,
    setSelectedDeploymentsAgentId,
    deploymentsLoadingFor,
    deployingAgentId,
    refetch,
  };
}

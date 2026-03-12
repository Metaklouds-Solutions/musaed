import { useState, useMemo, useCallback } from 'react';
import { adminAdapter, agentsAdapter, auditAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminAgentRow, ChannelDeploymentSummary } from '../../../shared/types';
import { ApiClientError } from '../../../lib/apiClient';

const DEFAULT_PAGE_SIZE = 20;

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

/** Admin agents data hook with filtering, pagination, and tenant assignment actions. */
export function useAdminAgents() {
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deployingAgentId, setDeployingAgentId] = useState<string | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [deploymentsLoadingFor, setDeploymentsLoadingFor] = useState<string | null>(null);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);
  const [selectedDeploymentsAgentId, setSelectedDeploymentsAgentId] = useState<string | null>(null);
  const [deploymentsByAgentId, setDeploymentsByAgentId] = useState<
    Record<string, ChannelDeploymentSummary[]>
  >({});

  const fetchAgents = useCallback(
    () =>
      agentsAdapter.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: statusFilter ?? undefined,
        tenantId: tenantFilter ?? undefined,
      }),
    [page, statusFilter, tenantFilter, refreshKey],
  );

  const { data: listResult, loading, error: agentsError, refetch } = useAsyncData(
    fetchAgents,
    [page, statusFilter, tenantFilter, refreshKey],
    { data: [] as AdminAgentRow[], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE },
  );

  const filteredAgents = listResult.data;
  const total = listResult.total;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const agentsErrorMessage = agentsError ? mapApiErrorMessage(agentsError) : null;

  const { data: tenants } = useAsyncData(() => adminAdapter.getTenants(), [], []);

  const setTenantFilterAndResetPage = useCallback((value: string | null) => {
    setTenantFilter(value);
    setPage(1);
  }, []);

  const setStatusFilterAndResetPage = useCallback((value: string | null) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

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

  const deleteAgent = useCallback(async (agent: AdminAgentRow) => {
    if (deletingAgentId === agent.id) {
      throw new Error('Delete already in progress for this agent');
    }
    setDeletingAgentId(agent.id);
    try {
      await agentsAdapter.delete(agent.id);
      auditAdapter.log('agent.deleted', {
        agentId: agent.id,
        agentName: agent.name,
        tenantId: agent.tenantId,
      });
      setRefreshKey((k) => k + 1);
    } catch (error: unknown) {
      throw new Error(mapApiErrorMessage(error));
    } finally {
      setDeletingAgentId(null);
    }
  }, [deletingAgentId]);

  const [syncingAgentId, setSyncingAgentId] = useState<string | null>(null);

  const syncAgent = useCallback(async (agent: AdminAgentRow) => {
    if (syncingAgentId === agent.id) {
      throw new Error('Sync already in progress for this agent');
    }
    setSyncingAgentId(agent.id);
    try {
      await agentsAdapter.syncFromRetell(agent.id);
      auditAdapter.log('agent.synced', {
        agentId: agent.id,
        agentName: agent.name,
      });
      setRefreshKey((k) => k + 1);
    } catch (error: unknown) {
      throw new Error(mapApiErrorMessage(error));
    } finally {
      setSyncingAgentId(null);
    }
  }, [syncingAgentId]);

  return {
    tenants,
    filteredAgents,
    loading,
    agentsError: agentsErrorMessage,
    total,
    totalPages,
    page,
    setPage,
    pageSize: DEFAULT_PAGE_SIZE,
    tenantFilter,
    setTenantFilter: setTenantFilterAndResetPage,
    statusFilter,
    setStatusFilter: setStatusFilterAndResetPage,
    assignAgent,
    deployAgent,
    loadDeployments,
    deploymentsByAgentId,
    deploymentsError,
    selectedDeploymentsAgentId,
    setSelectedDeploymentsAgentId,
    deploymentsLoadingFor,
    deployingAgentId,
    deleteAgent,
    deletingAgentId,
    syncAgent,
    syncingAgentId,
    refetch,
  };
}

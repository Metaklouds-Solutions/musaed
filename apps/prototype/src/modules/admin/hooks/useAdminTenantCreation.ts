import { useCallback } from 'react';
import { agentsAdapter, tenantsAdapter, auditAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AdminAgentRow } from '../../../shared/types';

interface CreateTenantInput {
  name: string;
  plan: string;
  ownerEmail: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  timezone: string;
  locale: string;
}

/** Tenant creation hook for template-first onboarding workflow. */
export function useAdminTenantCreation() {
  const {
    data: assignableAgents,
    loading: assignableAgentsLoading,
    error: assignableAgentsError,
    refetch: refetchAssignableAgents,
  } = useAsyncData(
    async () => {
      const allAgents = await Promise.resolve(agentsAdapter.list());
      return allAgents.filter((agent) => !agent.tenantId);
    },
    [],
    [] as AdminAgentRow[],
  );

  const createTenant = useCallback(async (input: CreateTenantInput) => {
    const tenant = await Promise.resolve(tenantsAdapter.createTenant(input));
    auditAdapter.log('tenant.created', { tenantId: tenant.id, name: tenant.name, plan: tenant.plan });
    return tenant;
  }, []);

  const assignAgentToTenant = useCallback(async (agentId: string, tenantId: string) => {
    await Promise.resolve(agentsAdapter.assign(agentId, tenantId));
    auditAdapter.log('agent.assigned', { agentId, tenantId });
  }, []);

  return {
    assignableAgents,
    assignableAgentsLoading,
    assignableAgentsError,
    refetchAssignableAgents,
    createTenant,
    assignAgentToTenant,
  };
}

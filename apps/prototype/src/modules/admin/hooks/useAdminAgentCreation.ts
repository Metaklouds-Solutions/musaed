import { useCallback } from 'react';
import { agentsAdapter, auditAdapter, tenantsAdapter } from '../../../adapters';
import { ApiClientError } from '../../../lib/apiClient';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AgentTemplateOption } from '../../../shared/types';

type AgentChannel = 'voice' | 'chat' | 'email';

interface CreateAdminAgentInput {
  tenantId: string;
  templateId: string;
  name: string;
  channelsEnabled: AgentChannel[];
  capabilityLevel?: string;
  deployNow: boolean;
}

function mapApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 0) return 'Cannot reach backend API. Please check server status and retry.';
    if (error.status === 401) return 'Your session expired. Please sign in again.';
    if (error.status === 403) return 'You do not have permission to create agents.';
    if (error.status === 429) return 'Too many requests. Please wait a moment and retry.';
    return error.message || 'Failed to create agent';
  }
  return error instanceof Error ? error.message : 'Failed to create agent';
}

/** Provides admin agent-creation actions and template catalog state for the wizard UI. */
export function useAdminAgentCreation() {
  const {
    data: templates,
    loading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useAsyncData(
    () => Promise.resolve(tenantsAdapter.getPlatformAgents()),
    [],
    [] as AgentTemplateOption[],
  );

  const createAgent = useCallback(async (input: CreateAdminAgentInput) => {
    try {
      const created = await agentsAdapter.createForTenant(input.tenantId, {
        templateId: input.templateId,
        name: input.name,
        channelsEnabled: input.channelsEnabled,
        capabilityLevel: input.capabilityLevel,
      });
      auditAdapter.log('agent.created', {
        agentId: created.id,
        tenantId: input.tenantId,
        templateId: input.templateId,
        channelsEnabled: input.channelsEnabled,
      });
      if (input.deployNow) {
        await agentsAdapter.deploy(created.id);
        auditAdapter.log('agent.deployment_queued', { agentId: created.id, tenantId: input.tenantId });
      }
      return created;
    } catch (error: unknown) {
      throw new Error(mapApiError(error));
    }
  }, []);

  return {
    templates,
    templatesLoading,
    templatesError,
    refetchTemplates,
    createAgent,
  };
}


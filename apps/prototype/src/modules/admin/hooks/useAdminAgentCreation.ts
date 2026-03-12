import { useCallback } from 'react';
import { agentsAdapter, auditAdapter, tenantsAdapter } from '../../../adapters';
import { ApiClientError } from '../../../lib/apiClient';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AgentTemplateOption } from '../../../shared/types';

type AgentChannel = 'voice' | 'chat' | 'email';

interface CreateAdminAgentInput {
  templateId: string;
  name: string;
  channelsEnabled: AgentChannel[];
  capabilityLevel?: string;
  tenantId?: string;
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

/**
 * Provides admin agent-creation actions and template catalog state for the wizard UI.
 * Supports creating agents with or without tenant assignment.
 * When a tenantId is provided, the backend auto-deploys to Retell.
 */
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
      const payload = {
        templateId: input.templateId,
        name: input.name,
        channelsEnabled: input.channelsEnabled,
        capabilityLevel: input.capabilityLevel,
      };

      const created = input.tenantId
        ? await agentsAdapter.createForTenant(input.tenantId, payload)
        : await agentsAdapter.createUnassigned(payload);

      auditAdapter.log('agent.created', {
        agentId: created.id,
        templateId: input.templateId,
        channelsEnabled: input.channelsEnabled,
        tenantId: input.tenantId ?? null,
        autoDeployed: Boolean(input.tenantId),
      });
      return { ...created, autoDeployed: Boolean(input.tenantId) };
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


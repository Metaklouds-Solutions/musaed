import { useCallback } from 'react';
import { tenantsAdapter, auditAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AgentTemplateOption } from '../../../shared/types';

interface CreateTenantInput {
  name: string;
  plan: string;
  ownerEmail: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  timezone: string;
  locale: string;
  templateId?: string;
  channelsEnabled?: Array<'voice' | 'chat' | 'email'>;
}

/** Tenant creation hook for template-first onboarding workflow. */
export function useAdminTenantCreation() {
  const {
    data: templates,
    loading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useAsyncData(
    async () => tenantsAdapter.getPlatformAgents(),
    [],
    [] as AgentTemplateOption[],
  );

  const createTenant = useCallback(async (input: CreateTenantInput) => {
    const tenant = await Promise.resolve(tenantsAdapter.createTenant(input));
    auditAdapter.log('tenant.created', { tenantId: tenant.id, name: tenant.name, plan: tenant.plan });
    return tenant;
  }, []);

  return {
    templates,
    templatesLoading,
    templatesError,
    refetchTemplates,
    createTenant,
  };
}

import { useMemo, useCallback } from 'react';
import { tenantsAdapter, auditAdapter } from '../../../adapters';

interface CreateTenantInput {
  name: string;
  plan: string;
  ownerEmail: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  timezone: string;
  locale: string;
  agentId?: string;
}

/** Tenant creation hook for wizard platform-agent list and creation workflow. */
export function useAdminTenantCreation() {
  const platformAgents = useMemo(() => tenantsAdapter.getPlatformAgents(), []);

  const createTenant = useCallback((input: CreateTenantInput) => {
    const tenant = tenantsAdapter.createTenant(input);
    auditAdapter.log('tenant.created', { tenantId: tenant.id, name: tenant.name, plan: tenant.plan });
    return tenant;
  }, []);

  return { platformAgents, createTenant };
}

/**
 * Tenant detail hook. Uses tenantsAdapter.getTenantDetailFull.
 */

import { useParams } from 'react-router-dom';
import { tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { TenantDetailFull } from '../../../shared/types';

export function useTenantDetail(): {
  tenant: TenantDetailFull | null;
  tenantId: string | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, loading: isLoading, refetch } = useAsyncData(
    () => (id ? tenantsAdapter.getTenantDetailFull(id) : null),
    [id],
    null as TenantDetailFull | null,
  );
  return {
    tenant,
    tenantId: id ?? null,
    isLoading,
    refetch,
  };
}

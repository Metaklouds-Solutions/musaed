/**
 * Tenant detail hook. Uses tenantsAdapter.getTenantDetailFull.
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { tenantsAdapter } from '../../../adapters';
import type { TenantDetailFull } from '../../../shared/types';

export function useTenantDetail(): {
  tenant: TenantDetailFull | null;
  tenantId: string | null;
  isLoading: boolean;
} {
  const { id } = useParams<{ id: string }>();
  const tenant = useMemo(() => {
    if (!id) return null;
    return tenantsAdapter.getTenantDetailFull(id);
  }, [id]);
  return {
    tenant,
    tenantId: id ?? null,
    isLoading: false,
  };
}

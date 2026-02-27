/**
 * Admin tenant detail hook. Uses tenantsAdapter.
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { tenantsAdapter } from '../../../adapters';
import type { TenantDetail } from '../../../shared/types';

export function useAdminTenantDetail(): {
  tenant: TenantDetail | null;
  isLoading: boolean;
} {
  const { id } = useParams<{ id: string }>();
  const tenant = useMemo(() => {
    if (!id) return null;
    return tenantsAdapter.getTenantDetail(id);
  }, [id]);
  return { tenant, isLoading: false };
}

/**
 * Admin staff hook. Cross-tenant list with filters.
 */

import { useMemo, useState, useCallback } from 'react';
import { staffAdapter } from '../../../adapters/local/staff.adapter';
import { adminAdapter } from '../../../adapters';

export function useAdminStaff() {
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tenants = useMemo(() => adminAdapter.getTenants(), []);
  const allStaff = useMemo(() => staffAdapter.list(), [refreshKey]);

  const staff = useMemo(() => {
    let result = allStaff;
    if (tenantFilter) result = result.filter((s) => s.tenantId === tenantFilter);
    if (roleFilter) result = result.filter((s) => s.roleSlug === roleFilter);
    return result;
  }, [allStaff, tenantFilter, roleFilter]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    staff,
    tenants,
    tenantFilter,
    setTenantFilter,
    roleFilter,
    setRoleFilter,
    refetch,
  };
}

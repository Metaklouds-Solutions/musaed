/**
 * Admin staff hook. Cross-tenant list with filters.
 */

import { useMemo, useState, useCallback } from 'react';
import { staffAdapter, adminAdapter, exportAdapter, softDeleteAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { StaffRow } from '../../../shared/types';

/** Returns staff list state, filters, and admin staff mutation/export actions. */
export function useAdminStaff() {
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: tenants } = useAsyncData(() => adminAdapter.getTenants(), [], []);
  const { data: allStaff, loading, refetch } = useAsyncData(
    () => staffAdapter.list(),
    [refreshKey],
    [] as StaffRow[],
  );

  const staff = useMemo(() => {
    let result = allStaff;
    if (tenantFilter) result = result.filter((s) => s.tenantId === tenantFilter);
    if (roleFilter) result = result.filter((s) => s.roleSlug === roleFilter);
    return result;
  }, [allStaff, tenantFilter, roleFilter]);

  const addStaff = useCallback(
    async (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      const added = await Promise.resolve(staffAdapter.add(data));
      setRefreshKey((k) => k + 1);
      return added;
    },
    []
  );

  const archiveStaff = useCallback(
    (userId: string, tenantId: string) => {
      softDeleteAdapter.softDeleteStaff(userId, tenantId);
      setRefreshKey((k) => k + 1);
    },
    []
  );

  const exportStaffCsv = useCallback((rows: Record<string, string>[], fileName: string) => {
    exportAdapter.exportCsv(rows, fileName);
  }, []);

  const toExportRows = useCallback(
    (rows: StaffRow[]) =>
      rows.map((s) => ({
        Name: s.name,
        Email: s.email,
        Role: s.roleLabel,
        Tenant: s.tenantName ?? s.tenantId,
        Status: s.status,
      })),
    []
  );

  return {
    staff,
    tenants,
    tenantFilter,
    setTenantFilter,
    roleFilter,
    setRoleFilter,
    refetch,
    loading,
    addStaff,
    archiveStaff,
    exportStaffCsv,
    toExportRows,
  };
}

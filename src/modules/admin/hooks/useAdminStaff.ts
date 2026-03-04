/**
 * Admin staff hook. Cross-tenant list with filters.
 */

import { useMemo, useState, useCallback } from 'react';
import { staffAdapter, adminAdapter, exportAdapter, softDeleteAdapter } from '../../../adapters';
import type { StaffRow } from '../../../shared/types';

/** Returns staff list state, filters, and admin staff mutation/export actions. */
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

  const addStaff = useCallback(
    (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      const added = staffAdapter.add(data);
      refetch();
      return added;
    },
    [refetch]
  );

  const archiveStaff = useCallback(
    (userId: string, tenantId: string) => {
      softDeleteAdapter.softDeleteStaff(userId, tenantId);
      refetch();
    },
    [refetch]
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
    addStaff,
    archiveStaff,
    exportStaffCsv,
    toExportRows,
  };
}

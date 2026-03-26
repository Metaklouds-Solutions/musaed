import { useCallback } from 'react';
import { softDeleteAdapter, exportAdapter } from '../../../adapters';
import type { TenantListRow } from '../../../shared/types';

/** Admin tenants actions hook for archive and CSV export operations. */
export function useAdminTenantsActions() {
  const archiveTenant = useCallback(async (tenantId: string) => {
    await Promise.resolve(softDeleteAdapter.softDeleteTenant(tenantId));
  }, []);

  const toExportRows = useCallback(
    (rows: TenantListRow[]) =>
      rows.map((t) => ({
        ID: t.id,
        Name: t.name,
        Plan: t.plan,
        Status: t.status,
        Agents: t.agentCount,
        MRR: t.mrr,
        Calls: t.callsThisMonth,
        Onboarding: t.onboardingStatus,
      })),
    []
  );

  const exportTenantsCsv = useCallback(
    async (rows: Record<string, string | number>[]) => {
      await exportAdapter.exportTenantsCsv(rows);
    },
    []
  );

  return { archiveTenant, toExportRows, exportTenantsCsv };
}

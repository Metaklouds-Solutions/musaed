/**
 * Local staff adapter. List, add, import CSV (stub).
 * Soft-deleted staff are excluded from lists.
 */

import { softDeleteAdapter } from './softDelete.adapter';
import {
  seedTenantMemberships,
  seedStaffUsers,
  seedTenants,
} from '../../mock/seedData';
import type { StaffRow } from '../../shared/types';

const ROLE_LABELS: Record<string, string> = {
  tenant_owner: 'Owner',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
};

const tenantName = (id: string) => seedTenants.find((t) => t.id === id)?.name ?? id;

/** In-memory staff added via Add Staff. */
const addedStaff: StaffRow[] = [];

export const staffAdapter = {
  /** List staff. Pass tenantId for tenant-scoped, omit for admin (all tenants). Excludes soft-deleted. */
  list(tenantId?: string): StaffRow[] {
    const deleted = softDeleteAdapter.getDeletedStaffKeys();
    const fromSeed = seedTenantMemberships
      .filter((m) => !tenantId || m.tenantId === tenantId)
      .filter((m) => !deleted.has(`${m.userId}::${m.tenantId}`))
      .map((m) => {
        const user = seedStaffUsers.find((u) => u.userId === m.userId);
        return {
          userId: m.userId,
          name: user?.name ?? m.userId,
          email: user?.email ?? '',
          roleSlug: m.roleSlug,
          roleLabel: ROLE_LABELS[m.roleSlug] ?? m.roleSlug,
          tenantId: m.tenantId,
          tenantName: tenantName(m.tenantId),
          status: m.status,
        } satisfies StaffRow;
      });
    const fromAdded = addedStaff.filter(
      (s) => (!tenantId || s.tenantId === tenantId) && !deleted.has(`${s.userId}::${s.tenantId}`)
    );
    return [...fromSeed, ...fromAdded];
  },

  /** Add staff (in-memory). */
  add(data: {
    name: string;
    email: string;
    roleSlug: string;
    tenantId: string;
  }): StaffRow {
    const userId = `u_${Date.now()}`;
    const row: StaffRow = {
      userId,
      name: data.name,
      email: data.email,
      roleSlug: data.roleSlug,
      roleLabel: ROLE_LABELS[data.roleSlug] ?? data.roleSlug,
      tenantId: data.tenantId,
      tenantName: tenantName(data.tenantId),
      status: 'active',
    };
    addedStaff.push(row);
    return row;
  },

  /** Import CSV (stub). Returns count of rows processed. */
  importCsv(_csv: string, tenantId: string): number {
    // Stub: parse CSV and call add() for each row
    return 0;
  },
};

/**
 * API staff adapter. Fetches tenant staff from backend.
 */

import { api } from '../../lib/apiClient';
import type { StaffRow } from '../../shared/types';

let cachedStaff: StaffRow[] = [];

export const staffAdapter = {
  list(tenantId?: string): StaffRow[] {
    if (tenantId) return cachedStaff.filter((s) => s.tenantId === tenantId);
    return cachedStaff;
  },

  add(data: { name: string; email: string; roleSlug: string; tenantId: string }): StaffRow {
    const row: StaffRow = {
      userId: `pending_${Date.now()}`,
      name: data.name,
      email: data.email,
      roleSlug: data.roleSlug,
      roleLabel: data.roleSlug,
      tenantId: data.tenantId,
      tenantName: '',
      status: 'invited',
    };
    api.post('/tenant/staff', { name: data.name, email: data.email, role: data.roleSlug })
      .then((created: any) => {
        row.userId = created.userId ?? row.userId;
        cachedStaff = [...cachedStaff, row];
      })
      .catch(() => {});
    return row;
  },

  importCsv(_csv: string, _tenantId: string): number {
    return 0;
  },

  async refresh(): Promise<void> {
    try {
      cachedStaff = await api.get<StaffRow[]>('/tenant/staff');
    } catch {
      // keep cache as-is
    }
  },
};

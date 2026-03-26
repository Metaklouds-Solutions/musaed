/**
 * API staff adapter. Fetches tenant staff from backend.
 */

import { api } from '../../lib/apiClient';
import type { StaffRow } from '../../shared/types';

const ROLE_LABELS: Record<string, string> = {
  tenant_owner: 'Tenant Owner',
  clinic_admin: 'Clinic Admin',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  auditor: 'Auditor',
  tenant_staff: 'Staff',
};

function mapStaffRow(s: any): StaffRow {
  const user = s.userId ?? {};
  return {
    userId: s._id,
    name: user.name ?? s.name ?? '',
    email: user.email ?? s.email ?? '',
    roleSlug: s.roleSlug,
    roleLabel: ROLE_LABELS[s.roleSlug] ?? s.roleSlug,
    tenantId: typeof s.tenantId === 'string' ? s.tenantId : s.tenantId?._id ?? '',
    tenantName: s.tenantId?.name ?? '',
    status: s.status,
  };
}

export const staffAdapter = {
  async list(tenantId?: string): Promise<StaffRow[]> {
    try {
      const qs = tenantId ? `?tenantId=${tenantId}` : '';
      const data = await api.get<any[]>(`/tenant/staff${qs}`);
      return (data ?? []).map(mapStaffRow);
    } catch {
      return [];
    }
  },

  async add(data: { name: string; email: string; roleSlug: string; tenantId: string }): Promise<StaffRow> {
    const created = await api.post<any>(`/tenant/staff?tenantId=${data.tenantId}`, {
      name: data.name,
      email: data.email,
      roleSlug: data.roleSlug,
    });
    return mapStaffRow(created);
  },

  async deleteStaff(id: string, tenantId?: string): Promise<void> {
    const qs = tenantId ? `?tenantId=${tenantId}` : '';
    await api.delete(`/tenant/staff/${id}${qs}`);
  },

  importCsv(_csv: string, _tenantId: string): number {
    return 0;
  },
};

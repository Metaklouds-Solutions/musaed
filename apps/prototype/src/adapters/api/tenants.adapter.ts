/**
 * API tenants adapter. Fetches tenant data from backend (admin routes).
 */

import { api } from '../../lib/apiClient';
import type {
  TenantDetail,
  AdminTenantRow,
  TenantListRow,
  TenantDetailFull,
  TenantMemberRow,
} from '../../shared/types';

let cachedTenantRows: TenantListRow[] = [];
let cachedAdminTenants: AdminTenantRow[] = [];

export const tenantsAdapter = {
  getTenantListRows(filters?: { status?: string; plan?: string; search?: string }): TenantListRow[] {
    let rows = [...cachedTenantRows];
    if (filters?.status) rows = rows.filter((t) => t.status === filters.status);
    if (filters?.plan) rows = rows.filter((t) => t.plan.toLowerCase() === (filters.plan ?? '').toLowerCase());
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((t) => t.name.toLowerCase().includes(q));
    }
    return rows;
  },

  getTenantDetailFull(id: string): TenantDetailFull | null {
    // Synchronous cache lookup; async refresh populates detail
    return null;
  },

  getMembers(_tenantId: string | undefined): TenantMemberRow[] {
    return [];
  },

  getAllTenants(): AdminTenantRow[] {
    return cachedAdminTenants;
  },

  getPlatformAgents(): { id: string; name: string; voice: string; language: string }[] {
    return [];
  },

  createTenant(data: {
    name: string;
    plan: string;
    ownerEmail: string;
    ownerName?: string;
    phone?: string;
    address?: string;
    timezone?: string;
    locale?: string;
    agentId?: string;
  }): AdminTenantRow {
    const row: AdminTenantRow = { id: `pending_${Date.now()}`, name: data.name, plan: data.plan };
    api.post('/admin/tenants', {
      name: data.name,
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
    }).then((created: any) => {
      row.id = created._id ?? row.id;
      cachedAdminTenants = [...cachedAdminTenants, row];
    }).catch(() => {});
    return row;
  },

  getTenantDetail(id: string): TenantDetail | null {
    return null;
  },

  async refresh(): Promise<void> {
    try {
      cachedAdminTenants = await api.get<AdminTenantRow[]>('/admin/tenants');
    } catch {
      // keep cache as-is
    }
  },
};

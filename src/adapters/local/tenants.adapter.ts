/**
 * Local tenants adapter. Tenant detail for admin. In-memory additions for Add Tenant.
 * Soft-deleted tenants are excluded from lists.
 */

import { softDeleteAdapter } from './softDelete.adapter';
import {
  seedTenants,
  seedTenantExtended,
  seedTenantPlans,
  seedTenantSettings,
  seedPlatformAgents,
} from '../../mock/seedData';
import type { TenantDetail, AdminTenantRow } from '../../shared/types';

/** In-memory tenants added via Add Tenant modal. */
const addedTenants: AdminTenantRow[] = [];

export const tenantsAdapter = {
  /** Get all tenants for admin list (seed + added). Excludes soft-deleted. */
  getAllTenants(): AdminTenantRow[] {
    const deleted = softDeleteAdapter.getDeletedTenantIds();
    const fromSeed = seedTenants
      .filter((t) => !deleted.has(t.id))
      .map((t) => {
        const plan = seedTenantPlans.find((p) => p.tenantId === t.id);
        return { id: t.id, name: t.name, plan: plan?.plan ?? '—' };
      });
    const fromAdded = addedTenants.filter((t) => !deleted.has(t.id));
    return [...fromSeed, ...fromAdded];
  },

  /** Get platform agents available for deployment. */
  getPlatformAgents(): { id: string; name: string; voice: string; language: string }[] {
    return [...seedPlatformAgents];
  },

  /** Create tenant (in-memory). Returns new tenant. */
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
    const id = `t_${Date.now()}`;
    const row: AdminTenantRow = { id, name: data.name, plan: data.plan };
    addedTenants.push(row);
    return row;
  },

  /** Get full tenant detail by ID. Returns null for soft-deleted tenants. */
  getTenantDetail(id: string): TenantDetail | null {
    if (softDeleteAdapter.isTenantDeleted(id)) return null;
    const fromAdded = addedTenants.find((t) => t.id === id);
    if (fromAdded) {
      return {
        id: fromAdded.id,
        name: fromAdded.name,
        plan: fromAdded.plan,
        status: 'TRIAL',
        createdAt: new Date().toISOString(),
        onboardingStep: 1,
        onboardingComplete: false,
        timezone: 'UTC',
        locale: 'en-US',
        businessHours: '—',
      };
    }
    const tenant = seedTenants.find((t) => t.id === id);
    if (!tenant) return null;
    const ext = seedTenantExtended.find((e) => e.tenantId === id);
    const plan = seedTenantPlans.find((p) => p.tenantId === id);
    const settings = seedTenantSettings.find((s) => s.tenantId === id);
    return {
      id: tenant.id,
      name: tenant.name,
      plan: plan?.plan ?? '—',
      status: ext?.status ?? 'ACTIVE',
      createdAt: ext?.createdAt ?? new Date().toISOString(),
      onboardingStep: ext?.onboardingStep ?? 0,
      onboardingComplete: (ext?.onboardingStep ?? 0) >= 4,
      timezone: settings?.timezone ?? 'UTC',
      locale: settings?.locale ?? 'en-US',
      businessHours: settings?.businessHours ?? '—',
    };
  },
};

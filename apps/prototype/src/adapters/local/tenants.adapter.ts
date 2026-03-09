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
  seedTenantListRows,
  seedTenantDetail,
  seedCredits,
  seedCalls,
  seedBookings,
} from '../../mock/seedData';
import { staffAdapter } from './staff.adapter';
import { supportAdapter } from './support.adapter';
import { agentsAdapter } from './agents.adapter';
import type { TenantDetail, AdminTenantRow, TenantListRow, TenantDetailFull, TenantMemberRow } from '../../shared/types';

/** In-memory tenants added via Add Tenant modal. */
const addedTenants: AdminTenantRow[] = [];

/** Status overrides for enable/disable in local mode. */
const tenantStatusOverrides: Record<string, 'ACTIVE' | 'SUSPENDED'> = {};

const ROLE_LABELS: Record<string, string> = {
  tenant_owner: 'Tenant Owner',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  auditor: 'Auditor',
};

export const tenantsAdapter = {
  /** Get tenant list rows for AdminTenantsPage. Excludes soft-deleted. Includes added tenants. */
  getTenantListRows(filters?: { status?: string; plan?: string; search?: string }): TenantListRow[] {
    const deleted = softDeleteAdapter.getDeletedTenantIds();
    const fromAdded: TenantListRow[] = addedTenants
      .filter((t) => !deleted.has(t.id))
      .map((t) => {
        const override = tenantStatusOverrides[t.id];
        return {
          id: t.id,
          name: t.name,
          plan: t.plan,
          status: (override ?? 'TRIAL') as 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ONBOARDING' | 'CHURNED',
        agentCount: 0,
        mrr: 0,
        callsThisMonth: 0,
        onboardingStatus: 'Step 1/4',
        createdAt: new Date().toISOString(),
      };
      });
    const fromSeed = seedTenantListRows
      .filter((t) => !deleted.has(t.id))
      .map((t) => {
        const override = tenantStatusOverrides[t.id];
        return override ? { ...t, status: override } : t;
      });
    const existingIds = new Set(fromSeed.map((r) => r.id));
    const addedOnly = fromAdded.filter((a) => !existingIds.has(a.id));
    let rows = [...addedOnly.reverse(), ...fromSeed];
    if (filters?.status) {
      rows = rows.filter((t) => t.status === filters.status);
    }
    if (filters?.plan) {
      rows = rows.filter((t) => t.plan.toLowerCase() === (filters.plan ?? '').toLowerCase());
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((t) => t.name.toLowerCase().includes(q));
    }
    return rows;
  },

  /** Get full tenant detail for TenantDetailPage. Returns null for soft-deleted or unknown. */
  getTenantDetailFull(id: string): TenantDetailFull | null {
    if (softDeleteAdapter.isTenantDeleted(id)) return null;
    if (id === seedTenantDetail.id) return { ...seedTenantDetail };
    const tenant = seedTenants.find((t) => t.id === id);
    if (!tenant) return null;
    const planRow = seedTenantPlans.find((p) => p.tenantId === id);
    const ext = seedTenantExtended.find((e) => e.tenantId === id);
    const settings = seedTenantSettings.find((s) => s.tenantId === id);
    const credits = seedCredits.find((c) => c.tenantId === id);
    const tenantCalls = seedCalls.filter((c) => c.tenantId === id);
    const tenantBookings = seedBookings.filter((b) => b.tenantId === id);
    const agents = agentsAdapter.getAgentsForTenant(id);
    const tickets = supportAdapter.listTickets({ tenantId: id });
    const staff = staffAdapter.list(id);
    const conversionRate =
      tenantCalls.length > 0
        ? Math.round((tenantBookings.length / tenantCalls.length) * 1000) / 10
        : 0;
    const avgDuration =
      tenantCalls.length > 0
        ? Math.round(
            tenantCalls.reduce((s, c) => s + c.duration, 0) / tenantCalls.length
          )
        : 0;
    const avgDurationStr =
      avgDuration >= 60
        ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`
        : `${avgDuration}s`;

    return {
      id,
      profile: {
        clinicName: tenant.name,
        owner: '',
        email: '',
        phone: '',
        address: '',
        timezone: settings?.timezone ?? 'UTC',
        locale: settings?.locale ?? 'en-US',
        plan: planRow?.plan ?? '—',
        status: ext?.status ?? 'ACTIVE',
        mrr: planRow?.mrr ?? 0,
        createdAt: ext?.createdAt ?? new Date().toISOString(),
        lastActive:
          tenantCalls.length > 0
            ? tenantCalls.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0]?.createdAt ?? ''
            : '',
      },
      onboarding: [
        { step: 1, title: 'Clinic Info Submitted', done: true },
        { step: 2, title: 'Agent Deployed', done: agents.length > 0 },
        { step: 3, title: 'First Call Received', done: tenantCalls.length > 0 },
        { step: 4, title: 'Billing Activated', done: (ext?.onboardingStep ?? 0) >= 4 },
      ],
      quickStats: {
        totalCalls: tenantCalls.length,
        bookingsCreated: tenantBookings.length,
        escalations: tenantCalls.filter((c) => c.escalationFlag).length,
        conversionRate,
        avgCallDuration: avgDurationStr,
        creditsUsed: credits?.minutesUsed ?? 0,
        creditsRemaining: credits?.balance ?? 0,
      },
      members: staff.map(
        (s): TenantMemberRow => ({
          name: s.name,
          role: ROLE_LABELS[s.roleSlug] ?? s.roleSlug,
          status: s.status === 'active' ? 'active' : 'invited',
          joined: '',
        })
      ),
      agents,
      tickets: tickets.slice(0, 5).map((t) => ({
        id: `#${t.id.slice(-4)}`,
        title: t.title,
        priority: t.priority,
        status: t.status,
        createdAt: new Date(t.createdAt).toLocaleDateString(),
      })),
      billing: {
        currentPlan: `${planRow?.plan ?? '—'} — $${planRow?.mrr ?? 0}/month`,
        nextBillingDate: '',
        lastPayment: '',
        paymentMethod: '',
        creditsBalance: credits?.balance ?? 0,
        overageRate: '$0.08/min',
      },
      settings: {
        businessHours: settings?.businessHours ?? '—',
        afterHoursBehavior: 'Voicemail + Callback',
        notifications: 'Email + SMS',
        featureFlags: {},
        pmsIntegration: '—',
      },
    };
  },

  /** Get members for a tenant (for TenantDetailPage Members tab). */
  getMembers(tenantId: string | undefined): TenantMemberRow[] {
    if (!tenantId) return [];
    const staff = staffAdapter.list(tenantId);
    return staff.map((s) => ({
      name: s.name,
      role: ROLE_LABELS[s.roleSlug] ?? s.roleSlug,
      status: s.status === 'active' ? 'active' : 'invited',
      joined: '',
    }));
  },

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
    return [...fromAdded.reverse(), ...fromSeed];
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

  deleteTenant(id: string): void {
    softDeleteAdapter.softDeleteTenant(id);
  },

  enableTenant(id: string): void {
    tenantStatusOverrides[id] = 'ACTIVE';
  },

  disableTenant(id: string): void {
    tenantStatusOverrides[id] = 'SUSPENDED';
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

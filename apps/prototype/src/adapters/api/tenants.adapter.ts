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

export const tenantsAdapter = {
  async getTenantListRows(filters?: { status?: string; plan?: string; search?: string }): Promise<TenantListRow[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: any[]; total: number }>(`/admin/tenants?${qs}`);
      return (resp.data ?? []).map((t: any) => ({
        id: t._id,
        name: t.name,
        plan: t.planId?.name ?? '—',
        status: t.status,
        agentCount: 0,
        mrr: 0,
        callsThisMonth: 0,
        onboardingStatus: t.onboardingComplete ? 'Complete' : `Step ${t.onboardingStep ?? 0}/4`,
        createdAt: t.createdAt,
      }));
    } catch (err) {
      console.warn('[tenants] getTenantListRows failed:', err);
      return [];
    }
  },

  async getTenantDetailFull(id: string): Promise<TenantDetailFull | null> {
    try {
      const t = await api.get<any>(`/admin/tenants/${id}`);
      if (!t) return null;
      const owner = t.ownerId ?? {};
      return {
        id: t._id,
        profile: {
          clinicName: t.name,
          owner: owner.name ?? '',
          email: owner.email ?? '',
          phone: '',
          address: '',
          timezone: t.timezone ?? 'Asia/Riyadh',
          locale: t.locale ?? 'ar',
          plan: t.planId?.name ?? '—',
          status: t.status,
          mrr: 0,
          createdAt: t.createdAt,
          lastActive: '',
        },
        onboarding: [
          { step: 1, title: 'Clinic Info Submitted', done: true },
          { step: 2, title: 'Agent Deployed', done: (t.onboardingStep ?? 0) >= 2 },
          { step: 3, title: 'First Call Received', done: (t.onboardingStep ?? 0) >= 3 },
          { step: 4, title: 'Billing Activated', done: t.onboardingComplete ?? false },
        ],
        quickStats: {
          totalCalls: 0,
          bookingsCreated: 0,
          escalations: 0,
          conversionRate: 0,
          avgCallDuration: '0s',
          creditsUsed: 0,
          creditsRemaining: 0,
        },
        members: [],
        agents: [],
        tickets: [],
        billing: {
          currentPlan: t.planId?.name ?? '—',
          nextBillingDate: '',
          lastPayment: '',
          paymentMethod: '',
          creditsBalance: 0,
          overageRate: '$0.08/min',
        },
        settings: {
          businessHours: t.settings?.businessHours ?? '—',
          afterHoursBehavior: 'Voicemail + Callback',
          notifications: 'Email + SMS',
          featureFlags: {},
          pmsIntegration: '—',
        },
      };
    } catch {
      return null;
    }
  },

  async getMembers(tenantId: string | undefined): Promise<TenantMemberRow[]> {
    return [];
  },

  async getAllTenants(): Promise<AdminTenantRow[]> {
    try {
      const resp = await api.get<{ data: any[] }>('/admin/tenants?page=1&limit=100');
      return (resp.data ?? []).map((t: any) => ({
        id: t._id,
        name: t.name,
        plan: t.planId?.name ?? '—',
      }));
    } catch (err) {
      console.warn('[tenants] getAllTenants failed:', err);
      return [];
    }
  },

  getPlatformAgents(): { id: string; name: string; voice: string; language: string }[] {
    return [];
  },

  async createTenant(data: {
    name: string;
    plan: string;
    ownerEmail: string;
    ownerName?: string;
    phone?: string;
    address?: string;
    timezone?: string;
    locale?: string;
    agentId?: string;
  }): Promise<AdminTenantRow & { inviteSetupUrl?: string }> {
    const body: Record<string, string | undefined> = {
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
      timezone: data.timezone,
    };
    // Only include planId if it looks like a valid MongoId (24 hex chars)
    if (data.plan && /^[a-f0-9]{24}$/i.test(data.plan)) {
      body.planId = data.plan;
    }
    const created = await api.post<any>('/admin/tenants', body);
    const tenant = created.tenant ?? created;
    return {
      id: tenant._id,
      name: tenant.name,
      plan: data.plan,
      inviteSetupUrl: created.inviteSetupUrl,
    };
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/admin/tenants/${id}`);
  },

  async enableTenant(id: string): Promise<void> {
    await api.post(`/admin/tenants/${id}/enable`);
  },

  async disableTenant(id: string): Promise<void> {
    await api.post(`/admin/tenants/${id}/disable`);
  },

  async getTenantDetail(id: string): Promise<TenantDetail | null> {
    try {
      const t = await api.get<any>(`/admin/tenants/${id}`);
      if (!t) return null;
      return {
        id: t._id,
        name: t.name,
        plan: t.planId?.name ?? '—',
        status: t.status,
        createdAt: t.createdAt,
        onboardingStep: t.onboardingStep ?? 0,
        onboardingComplete: t.onboardingComplete ?? false,
        timezone: t.timezone ?? 'Asia/Riyadh',
        locale: t.locale ?? 'ar',
        businessHours: t.settings?.businessHours ?? '—',
      };
    } catch {
      return null;
    }
  },
};

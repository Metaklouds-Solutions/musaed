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
  AgentTemplateOption,
  AgentInstanceSummary,
} from '../../shared/types';

type AgentChannel = 'voice' | 'chat' | 'email';

interface TenantListApiResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
}

interface TenantApiResponse extends Record<string, unknown> {
  _id?: string;
  name?: string;
  status?: string;
  createdAt?: string;
  timezone?: string;
  locale?: string;
  onboardingStep?: number;
  onboardingComplete?: boolean;
  ownerId?: Record<string, unknown>;
  planId?: Record<string, unknown> | null;
  settings?: Record<string, unknown>;
}

interface AgentTemplateApiResponse extends Record<string, unknown> {
  _id?: string;
  name?: string;
  channel?: string;
  capabilityLevel?: string;
  supportedChannels?: unknown;
}

interface TenantAgentApiResponse extends Record<string, unknown> {
  _id?: string;
  tenantId?: string | Record<string, unknown>;
  name?: string;
  channel?: string;
  channelsEnabled?: unknown;
  status?: string;
  deployedAt?: string;
  lastSyncedAt?: string;
  retellAgentId?: string | null;
}

const templateChannelsCache = new Map<string, AgentChannel[]>();

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeChannels(rawChannels: unknown, fallbackChannel: unknown): AgentChannel[] {
  const fromArray = Array.isArray(rawChannels)
    ? rawChannels.filter((channel): channel is AgentChannel =>
        channel === 'voice' || channel === 'chat' || channel === 'email',
      )
    : [];
  if (fromArray.length > 0) {
    return fromArray;
  }
  const fallback = readString(fallbackChannel);
  if (fallback === 'voice' || fallback === 'chat' || fallback === 'email') {
    return [fallback];
  }
  return ['chat'];
}

function toTenantStatus(status: unknown): 'ACTIVE' | 'TRIAL' | 'SUSPENDED' {
  const value = readString(status);
  if (value === 'ACTIVE' || value === 'TRIAL' || value === 'SUSPENDED') {
    return value;
  }
  if (value === 'ONBOARDING') {
    return 'TRIAL';
  }
  return 'TRIAL';
}

function toSlug(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (normalized.length > 0) {
    return normalized;
  }
  return `tenant-${Date.now()}`;
}

function toAgentInstanceSummary(
  agent: TenantAgentApiResponse,
  fallbackTenantId: string,
): AgentInstanceSummary {
  const channelsEnabled = normalizeChannels(agent.channelsEnabled, agent.channel);
  const tenantId =
    typeof agent.tenantId === 'string'
      ? agent.tenantId
      : agent.tenantId && typeof agent.tenantId === 'object'
        ? readString((agent.tenantId as Record<string, unknown>)._id) ?? fallbackTenantId
        : fallbackTenantId;
  const tenantName =
    agent.tenantId && typeof agent.tenantId === 'object'
      ? readString((agent.tenantId as Record<string, unknown>).name)
      : null;
  return {
    id: readString(agent._id) ?? '',
    tenantId,
    tenantName,
    name: readString(agent.name) ?? '',
    status: readString(agent.status) ?? 'paused',
    channel: channelsEnabled[0] ?? 'chat',
    channelsEnabled,
    deployedAt: readString(agent.deployedAt),
    lastSyncedAt: readString(agent.lastSyncedAt),
  };
}

export const tenantsAdapter = {
  async getTenantListRows(filters?: { status?: string; plan?: string; search?: string }): Promise<TenantListRow[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<TenantListApiResponse>(`/admin/tenants?${qs}`);
      return (resp.data ?? []).map((tenant) => ({
        id: readString(tenant._id) ?? '',
        name: readString(tenant.name) ?? '',
        plan:
          tenant.planId && typeof tenant.planId === 'object'
            ? readString((tenant.planId as Record<string, unknown>).name) ?? '—'
            : '—',
        status: toTenantStatus(tenant.status),
        agentCount: 0,
        mrr: 0,
        callsThisMonth: 0,
        onboardingStatus:
          tenant.onboardingComplete === true
            ? 'Complete'
            : `Step ${typeof tenant.onboardingStep === 'number' ? tenant.onboardingStep : 0}/4`,
        createdAt: readString(tenant.createdAt) ?? '',
      }));
    } catch (err) {
      if (!(err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 0)) {
        console.warn('[tenants] getTenantListRows failed:', err);
      }
      return [];
    }
  },

  async getTenantDetailFull(id: string): Promise<TenantDetailFull | null> {
    try {
      const t = await api.get<TenantApiResponse>(`/admin/tenants/${id}`);
      if (!t) return null;
      const owner = t.ownerId && typeof t.ownerId === 'object' ? t.ownerId : {};
      const agents = await api
        .get<TenantAgentApiResponse[]>(`/admin/agents/tenants/${id}`)
        .catch(() => [] as TenantAgentApiResponse[]);
      const summaries = agents.map((agent) => toAgentInstanceSummary(agent, id));
      return {
        id: readString(t._id) ?? id,
        profile: {
          clinicName: readString(t.name) ?? '',
          owner: readString(owner.name) ?? '',
          email: readString(owner.email) ?? '',
          phone: '',
          address: '',
          timezone: readString(t.timezone) ?? 'Asia/Riyadh',
          locale: readString(t.locale) ?? 'ar',
          plan:
            t.planId && typeof t.planId === 'object'
              ? readString((t.planId as Record<string, unknown>).name) ?? '—'
              : '—',
          status: toTenantStatus(t.status),
          mrr: 0,
          createdAt: readString(t.createdAt) ?? '',
          lastActive: '',
        },
        onboarding: [
          { step: 1, title: 'Clinic Info Submitted', done: true },
          {
            step: 2,
            title: 'Agent Deployed',
            done: (typeof t.onboardingStep === 'number' ? t.onboardingStep : 0) >= 2,
          },
          {
            step: 3,
            title: 'First Call Received',
            done: (typeof t.onboardingStep === 'number' ? t.onboardingStep : 0) >= 3,
          },
          { step: 4, title: 'Billing Activated', done: t.onboardingComplete === true },
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
        agents: agents.map((agent) => {
          const summary = toAgentInstanceSummary(agent, id);
          const retellAgentId =
            typeof agent.retellAgentId === 'string' && agent.retellAgentId.trim().length > 0
              ? agent.retellAgentId
              : null;
          return {
            id: summary.id,
            name: summary.name,
            channel: summary.channel,
            status: summary.status,
            voice: '—',
            language: 'en',
            lastSynced: summary.lastSyncedAt ?? summary.deployedAt ?? '—',
            retellAgentId,
          };
        }),
        tickets: [],
        billing: {
          currentPlan:
            t.planId && typeof t.planId === 'object'
              ? readString((t.planId as Record<string, unknown>).name) ?? '—'
              : '—',
          nextBillingDate: '',
          lastPayment: '',
          paymentMethod: '',
          creditsBalance: 0,
          overageRate: '$0.08/min',
        },
        settings: {
          businessHours:
            t.settings && typeof t.settings === 'object'
              ? readString((t.settings as Record<string, unknown>).businessHours) ?? '—'
              : '—',
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
      const resp = await api.get<TenantListApiResponse>('/admin/tenants?page=1&limit=100');
      return (resp.data ?? []).map((tenant) => ({
        id: readString(tenant._id) ?? '',
        name: readString(tenant.name) ?? '',
        plan:
          tenant.planId && typeof tenant.planId === 'object'
            ? readString((tenant.planId as Record<string, unknown>).name) ?? '—'
            : '—',
      }));
    } catch (err) {
      if (!(err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 0)) {
        console.warn('[tenants] getAllTenants failed:', err);
      }
      return [];
    }
  },

  async getPlatformAgents(): Promise<AgentTemplateOption[]> {
    const resp = await api.get<{ data?: AgentTemplateApiResponse[] }>('/admin/templates?page=1&limit=100');
    return (resp.data ?? []).map((template) => {
      const id = readString(template._id) ?? '';
      const channels = normalizeChannels(template.supportedChannels, template.channel);
      templateChannelsCache.set(id, channels);
      const channelLabel = channels.join(' + ');
      const capabilityLevel = readString(template.capabilityLevel) ?? 'L1';
      return {
        id,
        name: readString(template.name) ?? 'Unnamed Template',
        voice: channelLabel.length > 0 ? channelLabel : 'chat',
        language: capabilityLevel,
        channels,
        capabilityLevel,
      };
    });
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
    templateId?: string;
    channelsEnabled?: AgentChannel[];
  }): Promise<AdminTenantRow & { inviteSetupUrl?: string }> {
    const body: Record<string, string | AgentChannel[] | undefined> = {
      name: data.name,
      slug: toSlug(data.name),
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
      timezone: data.timezone,
    };
    // Only include planId if it looks like a valid MongoId (24 hex chars)
    if (data.plan && /^[a-f0-9]{24}$/i.test(data.plan)) {
      body.planId = data.plan;
    }
    if (data.templateId && /^[a-f0-9]{24}$/i.test(data.templateId)) {
      body.templateId = data.templateId;
      if (Array.isArray(data.channelsEnabled) && data.channelsEnabled.length > 0) {
        body.channelsEnabled = data.channelsEnabled;
      }
    }
    const created = await api.post<{ tenant?: TenantApiResponse; inviteSetupUrl?: string } | TenantApiResponse>(
      '/admin/tenants',
      body,
    );
    const wrappedTenant = 'tenant' in created ? created.tenant : undefined;
    const tenant = wrappedTenant ?? created;
    const inviteSetupUrl =
      'inviteSetupUrl' in created ? readString(created.inviteSetupUrl) ?? undefined : undefined;
    return {
      id: readString(tenant._id) ?? '',
      name: readString(tenant.name) ?? data.name,
      plan: data.plan,
      inviteSetupUrl,
    };
  },

  async updateTenant(
    id: string,
    data: { name?: string; timezone?: string; locale?: string },
  ): Promise<void> {
    await api.patch(`/admin/tenants/${id}`, data);
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
      const t = await api.get<TenantApiResponse>(`/admin/tenants/${id}`);
      if (!t) return null;
      return {
        id: readString(t._id) ?? id,
        name: readString(t.name) ?? '',
        plan:
          t.planId && typeof t.planId === 'object'
            ? readString((t.planId as Record<string, unknown>).name) ?? '—'
            : '—',
        status: toTenantStatus(t.status),
        createdAt: readString(t.createdAt) ?? '',
        onboardingStep: typeof t.onboardingStep === 'number' ? t.onboardingStep : 0,
        onboardingComplete: t.onboardingComplete === true,
        timezone: readString(t.timezone) ?? 'Asia/Riyadh',
        locale: readString(t.locale) ?? 'ar',
        businessHours:
          t.settings && typeof t.settings === 'object'
            ? readString((t.settings as Record<string, unknown>).businessHours) ?? '—'
            : '—',
      };
    } catch {
      return null;
    }
  },
};

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

interface AdminAgentsListApiResponse {
  data?: Array<Record<string, unknown>>;
}

interface AdminCallsListApiResponse {
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

interface TenantStaffApiResponse extends Record<string, unknown> {
  _id?: string;
  roleSlug?: string;
  status?: string;
  joinedAt?: string;
  invitedAt?: string;
  userId?: Record<string, unknown>;
}

interface TenantSupportApiResponse {
  data?: Array<Record<string, unknown>>;
}

interface TenantCallsApiResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
}

interface TenantBookingsApiResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
}

interface TenantAnalyticsResponse {
  totalCalls?: number;
  avgDuration?: number;
  outcomes?: {
    booked?: number;
    escalated?: number;
  };
}

interface TenantBillingApiResponse extends Record<string, unknown> {
  tenantId?: string;
  plan?: Record<string, unknown> | string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string;
  creditBalance?: number;
  minutesUsed?: number;
}

function isForbiddenError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: number }).status === 403,
  );
}

const templateChannelsCache = new Map<string, AgentChannel[]>();

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatAvgDuration(sec: number): string {
  if (sec <= 0) return '0s';
  if (sec < 60) return `${sec}s`;
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function withTenantScope(path: string, tenantId: string | null, isAdmin: boolean): string {
  if (!isAdmin || !tenantId) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenantId=${encodeURIComponent(tenantId)}`;
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

function roleLabel(roleSlug: string | null): string {
  switch (roleSlug) {
    case 'tenant_owner':
      return 'Tenant Owner';
    case 'clinic_admin':
      return 'Clinic Admin';
    case 'doctor':
      return 'Doctor';
    case 'receptionist':
      return 'Receptionist';
    default:
      return roleSlug ?? 'Staff';
  }
}

export const tenantsAdapter = {
  async getTenantListRows(filters?: { status?: string; plan?: string; search?: string }): Promise<TenantListRow[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      const qs = new URLSearchParams(params).toString();
      const [resp, agentsResp] = await Promise.all([
        api.get<TenantListApiResponse>(`/admin/tenants?${qs}`),
        api
          .get<AdminAgentsListApiResponse>('/admin/agents?page=1&limit=500')
          .catch(() => ({ data: [] } as AdminAgentsListApiResponse)),
      ]);

      const counts = new Map<string, number>();
      for (const agent of agentsResp.data ?? []) {
        const rawTenantId =
          typeof agent.tenantId === 'string'
            ? agent.tenantId
            : agent.tenantId && typeof agent.tenantId === 'object'
              ? readString((agent.tenantId as Record<string, unknown>)._id)
              : null;
        if (!rawTenantId) continue;
        counts.set(rawTenantId, (counts.get(rawTenantId) ?? 0) + 1);
      }

      return (resp.data ?? []).map((tenant) => {
        const id = readString(tenant._id) ?? '';
        const agentCount = counts.get(id) ?? readNumber(tenant.agentCount) ?? 0;
        const owner =
          tenant.ownerId && typeof tenant.ownerId === 'object'
            ? (tenant.ownerId as Record<string, unknown>)
            : null;
        const ownerStatus = owner ? readString(owner.status) : null;
        const ownerLastLoginAt = owner ? readString(owner.lastLoginAt) : null;
        const hasPlan =
          Boolean(
            tenant.planId &&
              typeof tenant.planId === 'object' &&
              readString((tenant.planId as Record<string, unknown>)._id),
          );
        const isActive = readString(tenant.status) === 'ACTIVE';

        let dynamicStep = 1;
        if (agentCount > 0) dynamicStep = 2;
        if (dynamicStep >= 2 && ownerStatus === 'active' && ownerLastLoginAt) dynamicStep = 3;
        if (dynamicStep >= 3 && (isActive || hasPlan)) dynamicStep = 4;

        return {
          id: readString(tenant._id) ?? '',
          name: readString(tenant.name) ?? '',
          plan:
          tenant.planId && typeof tenant.planId === 'object'
              ? readString((tenant.planId as Record<string, unknown>).name) ?? '—'
              : '—',
          status: toTenantStatus(tenant.status),
          agentCount,
          mrr: 0,
          callsThisMonth: 0,
          onboardingStatus: dynamicStep >= 4 ? 'Complete' : `Step ${dynamicStep}/4`,
          createdAt: readString(tenant.createdAt) ?? '',
        };
      });
    } catch (err) {
      if (!(err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 0)) {
        console.warn('[tenants] getTenantListRows failed:', err);
      }
      return [];
    }
  },

  async getTenantDetailFull(id: string): Promise<TenantDetailFull | null> {
    try {
      const me = await api.get<Record<string, unknown>>('/auth/me').catch(() => null);
      const role = (readString(me?.role) ?? '').toUpperCase();
      let isAdmin = role === 'ADMIN';
      let scopedTenantId: string | null = id;

      let t: TenantApiResponse | null = null;
      if (isAdmin) {
        try {
          t = await api.get<TenantApiResponse>(`/admin/tenants/${id}`);
        } catch (error) {
          if (isForbiddenError(error)) {
            isAdmin = false;
            t = await api.get<TenantApiResponse>('/tenant/settings').catch(() => null);
          } else {
            t = null;
          }
        }
      } else {
        t = await api.get<TenantApiResponse>('/tenant/settings').catch(() => null);
        scopedTenantId = readString(me?.tenantId) ?? readString(t?._id) ?? id;
      }
      const owner = t && t.ownerId && typeof t.ownerId === 'object' ? t.ownerId : {};
      const settingsRes = await api
        .get<{
          timezone?: string;
          locale?: string;
          settings?: Record<string, unknown>;
        }>(withTenantScope('/tenant/settings', scopedTenantId, isAdmin))
        .catch(() => null);

      const agentsPromise = isAdmin
        ? api
            .get<TenantAgentApiResponse[]>(`/admin/agents/tenants/${id}`)
            .catch(async (error) => {
              if (isForbiddenError(error)) {
                isAdmin = false;
                return api.get<TenantAgentApiResponse[]>('/tenant/agents').catch(() => [] as TenantAgentApiResponse[]);
              }
              return [] as TenantAgentApiResponse[];
            })
        : api.get<TenantAgentApiResponse[]>('/tenant/agents').catch(() => [] as TenantAgentApiResponse[]);

      const callsPromise = isAdmin
        ? api
            .get<AdminCallsListApiResponse>(
              `/admin/calls?tenantId=${encodeURIComponent(id)}&page=1&limit=1`,
            )
            .catch(async (error) => {
              if (isForbiddenError(error)) {
                isAdmin = false;
                return api
                  .get<TenantCallsApiResponse>('/tenant/calls?page=1&limit=1')
                  .catch(() => ({ total: 0, data: [] }));
              }
              return { total: 0, data: [] } as AdminCallsListApiResponse;
            })
        : api
            .get<TenantCallsApiResponse>('/tenant/calls?page=1&limit=1')
            .catch(() => ({ total: 0, data: [] }));

      const analyticsPromise = isAdmin
        ? api
            .get<TenantAnalyticsResponse>(
              `/admin/calls/analytics?tenantId=${encodeURIComponent(id)}`,
            )
            .catch(async (error) => {
              if (isForbiddenError(error)) {
                isAdmin = false;
                return api
                  .get<TenantAnalyticsResponse>('/tenant/calls/analytics')
                  .catch(() => null);
              }
              return null;
            })
        : api
            .get<TenantAnalyticsResponse>('/tenant/calls/analytics')
            .catch(() => null);

      const [agents, calls, bookings, staff, support, billing, analytics] = await Promise.all([
        agentsPromise,
        callsPromise,
        api
          .get<TenantBookingsApiResponse>(
            withTenantScope('/tenant/bookings?page=1&limit=1', scopedTenantId, isAdmin),
          )
          .catch(() => ({ total: 0, data: [] })),
        api
          .get<TenantStaffApiResponse[]>(
            withTenantScope('/tenant/staff', scopedTenantId, isAdmin),
          )
          .catch(() => [] as TenantStaffApiResponse[]),
        api
          .get<TenantSupportApiResponse>(
            withTenantScope('/tenant/support/tickets?page=1&limit=20', scopedTenantId, isAdmin),
          )
          .catch(() => ({ data: [] })),
        api
          .get<TenantBillingApiResponse>(
            withTenantScope('/tenant/billing', scopedTenantId, isAdmin),
          )
          .catch(() => ({}) as TenantBillingApiResponse),
        analyticsPromise,
      ]);
      const normalizedAgents = asArray<TenantAgentApiResponse>(agents);
      const normalizedStaff = asArray<TenantStaffApiResponse>(staff);
      const normalizedTickets = asArray<Record<string, unknown>>(support.data);
      const summaries = normalizedAgents.map((agent) =>
        toAgentInstanceSummary(agent, scopedTenantId ?? id),
      );
      const totalCallsCount = analytics?.totalCalls ?? calls.total ?? 0;
      const bookedCalls = analytics?.outcomes?.booked ?? bookings.total ?? 0;
      const escalatedCalls = analytics?.outcomes?.escalated ?? 0;
      const conversionRate =
        totalCallsCount > 0
          ? Math.round((bookedCalls / totalCallsCount) * 1000) / 10
          : 0;
      const avgCallDuration = formatAvgDuration(analytics?.avgDuration ?? 0);

      const hasAssignedAgent = summaries.length > 0;
      const hasDeployedAgent = summaries.some((summary) => {
        if (summary.deployedAt) return true;
        if (summary.status === 'active' || summary.status === 'partially_deployed') return true;
        const source = agents.find((a) => readString(a._id) === summary.id);
        return Boolean(source && typeof source.retellAgentId === 'string' && source.retellAgentId.trim().length > 0);
      });
      const hasFirstCall = (calls.total ?? 0) > 0 || (calls.data?.length ?? 0) > 0;
      const ownerStatus = readString((owner as Record<string, unknown>).status);
      const ownerLastLoginAt = readString((owner as Record<string, unknown>).lastLoginAt);
      const meLastLoginAt = readString(me?.lastLoginAt);
      // In tenant portal, trust the active authenticated session as login completion.
      const hasTenantSession = !isAdmin && Boolean(readString(me?._id) ?? readString(me?.id) ?? readString(me?.email));
      const hasOwnerLogin =
        (ownerStatus === 'active' && Boolean(ownerLastLoginAt)) ||
        Boolean(meLastLoginAt) ||
        hasTenantSession;
      const status = toTenantStatus(t?.status ?? 'TRIAL');
      const hasBillingActivated =
        status === 'ACTIVE' ||
        t?.onboardingComplete === true ||
        Boolean(
          t?.planId &&
            typeof t.planId === 'object' &&
            readString((t.planId as Record<string, unknown>)._id),
        );

      const tickets = normalizedTickets.map((ticket) => ({
        id: readString(ticket._id) ?? '',
        title: readString(ticket.title) ?? 'Ticket',
        priority: readString(ticket.priority) ?? 'normal',
        status: readString(ticket.status) ?? 'open',
        createdAt: readString(ticket.createdAt) ?? '',
      }));

      const members = normalizedStaff.map((m) => {
        const user = m.userId && typeof m.userId === 'object' ? m.userId : {};
        const statusRaw = readString(m.status) ?? 'invited';
        return {
          name: readString((user as Record<string, unknown>).name) ?? 'User',
          role: roleLabel(readString(m.roleSlug)),
          status: statusRaw === 'active' ? 'active' : 'invited',
          joined: readString(m.joinedAt) ?? readString(m.invitedAt) ?? '',
        } as TenantMemberRow;
      });

      return {
        id: readString(t?._id) ?? readString(me?.tenantId) ?? id,
        profile: {
          clinicName:
            readString(t?.name) ??
            readString(me?.tenantName) ??
            readString(me?.name) ??
            'Tenant',
          owner: readString(owner.name) ?? readString(me?.name) ?? '',
          email: readString(owner.email) ?? readString(me?.email) ?? '',
          phone: '',
          address: '',
          timezone: readString(t?.timezone) ?? readString(settingsRes?.timezone) ?? 'Asia/Riyadh',
          locale: readString(t?.locale) ?? readString(settingsRes?.locale) ?? 'ar',
          plan:
            t?.planId && typeof t.planId === 'object'
              ? readString((t.planId as Record<string, unknown>).name) ?? '—'
              : (readString(billing.plan) ?? '—'),
          status,
          mrr: 0,
          createdAt: readString(t?.createdAt) ?? '',
          lastActive: readString(owner.lastLoginAt) ?? readString(me?.lastLoginAt) ?? '',
        },
        onboarding: [
          { step: 1, title: 'Clinic Info Submitted', done: true },
          {
            step: 2,
            title: 'Agent Assigned',
            done: hasAssignedAgent,
          },
          {
            step: 3,
            title: 'Owner Login Completed',
            done: hasOwnerLogin || hasFirstCall,
          },
          { step: 4, title: 'Billing Activated', done: hasBillingActivated },
        ],
        quickStats: {
          totalCalls: totalCallsCount,
          bookingsCreated: bookedCalls,
          escalations: escalatedCalls,
          conversionRate,
          avgCallDuration,
          creditsUsed: Number((billing.minutesUsed as number | undefined) ?? 0),
          creditsRemaining: Number((billing.creditBalance as number | undefined) ?? 0),
        },
        members,
        agents: normalizedAgents.map((agent) => {
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
        tickets,
        billing: {
          currentPlan:
            (t?.planId && typeof t.planId === 'object'
              ? readString((t.planId as Record<string, unknown>).name)
              : null) ??
            (typeof billing.plan === 'object' && billing.plan !== null
              ? readString((billing.plan as Record<string, unknown>).name)
              : readString(billing.plan)) ??
            '—',
          nextBillingDate: '',
          lastPayment: '',
          paymentMethod: '',
          creditsBalance: Number((billing.creditBalance as number | undefined) ?? 0),
          overageRate: '$0.08/min',
        },
        settings: {
          businessHours:
            settingsRes?.settings && typeof settingsRes.settings === 'object'
              ? readString((settingsRes.settings as Record<string, unknown>).businessHours) ?? '—'
              : '—',
          afterHoursBehavior: 'Voicemail + Callback',
          notifications: 'Email + SMS',
          featureFlags:
            settingsRes?.settings && typeof settingsRes.settings === 'object'
              ? ((settingsRes.settings as Record<string, unknown>).featureFlags as Record<string, boolean> | undefined) ?? {}
              : {},
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
    const createdRecord = created as TenantApiResponse & {
      tenant?: TenantApiResponse;
      inviteSetupUrl?: string;
    };
    const wrappedTenant = createdRecord.tenant;
    const tenant = wrappedTenant ?? created;
    const inviteSetupUrl =
      readString(createdRecord.inviteSetupUrl) ?? undefined;
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

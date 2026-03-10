/**
 * API agents adapter. Fetches agent data from backend.
 */

import { api } from '../../lib/apiClient';
import type {
  TenantAgentDetail,
  AdminAgentRow,
  AdminAgentDetail,
  TenantAgentRow,
  AgentDetailFull,
  AgentInstanceSummary,
  ChannelDeploymentSummary,
} from '../../shared/types';

interface AdminAgentsListResponse {
  data?: AgentInstanceApiResponse[];
}

interface AgentInstanceApiResponse extends Record<string, unknown> {
  _id?: string;
  tenantId?: string | Record<string, unknown>;
  name?: string;
  status?: string;
  channel?: string;
  channelsEnabled?: unknown;
  deployedAt?: string;
  lastSyncedAt?: string;
}

interface DeployAgentResponse extends Record<string, unknown> {
  message?: string;
  agentInstanceId?: string;
  tenantId?: string;
  status?: string;
}

interface CreateAgentForTenantInput {
  templateId: string;
  name: string;
  channelsEnabled: AgentChannel[];
  capabilityLevel?: string;
}

interface ChannelDeploymentApiResponse extends Record<string, unknown> {
  _id?: string;
  channel?: unknown;
  provider?: unknown;
  status?: unknown;
  retellAgentId?: unknown;
  retellConversationFlowId?: unknown;
  error?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

type AgentChannel = 'voice' | 'chat' | 'email';
type StartableChannel = 'voice' | 'chat';

interface StartConversationResponse extends Record<string, unknown> {
  agentInstanceId?: unknown;
  channel?: unknown;
  retellAgentId?: unknown;
  retellConversationFlowId?: unknown;
  startedAt?: unknown;
}

function normalizeChannel(value: unknown): AgentChannel {
  if (value === 'voice' || value === 'chat' || value === 'email') {
    return value;
  }
  return 'chat';
}

function normalizeStartableChannel(value: unknown): StartableChannel {
  return value === 'voice' ? 'voice' : 'chat';
}

function normalizeChannels(rawChannels: unknown, fallbackChannel: unknown): AgentChannel[] {
  const channels: AgentChannel[] = [];
  if (Array.isArray(rawChannels)) {
    for (const value of rawChannels) {
      if (value === 'voice' || value === 'chat' || value === 'email') {
        channels.push(value);
      }
    }
  }
  if (channels.length > 0) {
    return channels;
  }
  return [normalizeChannel(fallbackChannel)];
}

function readStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function toChannelDeploymentSummary(
  deployment: ChannelDeploymentApiResponse,
): ChannelDeploymentSummary {
  const statusRaw = deployment.status;
  const status: 'pending' | 'active' | 'failed' =
    statusRaw === 'active' || statusRaw === 'failed' ? statusRaw : 'pending';
  return {
    id: readStringOrNull(deployment._id) ?? '',
    channel: normalizeChannel(deployment.channel),
    provider: readStringOrNull(deployment.provider) ?? 'retell',
    status,
    retellAgentId: readStringOrNull(deployment.retellAgentId),
    retellConversationFlowId: readStringOrNull(deployment.retellConversationFlowId),
    error: readStringOrNull(deployment.error),
    createdAt: readStringOrNull(deployment.createdAt),
    updatedAt: readStringOrNull(deployment.updatedAt),
  };
}

function toAgentInstanceSummary(agent: AgentInstanceApiResponse): AgentInstanceSummary {
  const channelsEnabled = normalizeChannels(agent.channelsEnabled, agent.channel);
  const tenantId =
    typeof agent.tenantId === 'string'
      ? agent.tenantId
      : agent.tenantId && typeof agent.tenantId === 'object'
        ? typeof (agent.tenantId as Record<string, unknown>)._id === 'string'
          ? ((agent.tenantId as Record<string, unknown>)._id as string)
          : null
        : null;
  const tenantName =
    agent.tenantId && typeof agent.tenantId === 'object'
      ? typeof (agent.tenantId as Record<string, unknown>).name === 'string'
        ? ((agent.tenantId as Record<string, unknown>).name as string)
        : null
      : null;
  return {
    id: typeof agent._id === 'string' ? agent._id : '',
    tenantId,
    tenantName,
    name: typeof agent.name === 'string' ? agent.name : '',
    status: typeof agent.status === 'string' ? agent.status : 'paused',
    channel: channelsEnabled[0] ?? 'chat',
    channelsEnabled,
    deployedAt: typeof agent.deployedAt === 'string' ? agent.deployedAt : null,
    lastSyncedAt: typeof agent.lastSyncedAt === 'string' ? agent.lastSyncedAt : null,
  };
}

export const agentsAdapter = {
  async list(): Promise<AdminAgentRow[]> {
    try {
      const resp = await api.get<AdminAgentsListResponse>('/admin/agents?page=1&limit=100');
      const summaries = (resp.data ?? []).map((agent) => toAgentInstanceSummary(agent));
      return summaries.map((summary) => ({
        id: summary.id,
        name: summary.name,
        externalAgentId: summary.id,
        voice: summary.channelsEnabled.join(' + '),
        language: 'en',
        status: summary.status,
        tenantId: summary.tenantId,
        tenantName: summary.tenantName,
        lastSyncedAt: summary.lastSyncedAt ?? '',
      }));
    } catch {
      return [];
    }
  },

  async listVoiceAgents(): Promise<AdminAgentRow[]> {
    const all = await this.list();
    return all.filter((a) => a.tenantId != null && a.status !== 'available');
  },

  async assign(agentId: string, tenantId: string): Promise<void> {
    await api.post(`/admin/agents/${agentId}/assign`, { tenantId });
  },

  async unassign(agentId: string): Promise<void> {
    await api.post(`/admin/agents/${agentId}/unassign`);
  },

  async deploy(agentId: string): Promise<DeployAgentResponse> {
    return api.post<DeployAgentResponse>(`/v1/admin/agents/${agentId}/deploy`);
  },

  async createForTenant(
    tenantId: string,
    input: CreateAgentForTenantInput,
  ): Promise<AgentInstanceSummary> {
    const created = await api.post<AgentInstanceApiResponse>(`/admin/agents/tenants/${tenantId}`, input);
    return toAgentInstanceSummary(created);
  },

  async getDeployments(agentId: string): Promise<ChannelDeploymentSummary[]> {
    const response = await api.get<ChannelDeploymentApiResponse[]>(
      `/admin/agents/${agentId}/deployments`,
    );
    return (response ?? []).map((item) => toChannelDeploymentSummary(item));
  },

  async getTenantDeployments(agentId: string): Promise<ChannelDeploymentSummary[]> {
    const response = await api.get<ChannelDeploymentApiResponse[]>(
      `/tenant/agents/${agentId}/deployments`,
    );
    return (response ?? []).map((item) => toChannelDeploymentSummary(item));
  },

  async startConversation(
    agentId: string,
    payload: { channel: StartableChannel; metadata?: Record<string, string>; tenantId?: string },
  ): Promise<{
    agentInstanceId: string;
    channel: StartableChannel;
    retellAgentId: string | null;
    retellConversationFlowId: string | null;
    startedAt: string;
  }> {
    const query =
      payload.tenantId && payload.tenantId.trim().length > 0
        ? `?tenantId=${encodeURIComponent(payload.tenantId)}`
        : '';
    const response = await api.post<StartConversationResponse>(
      `/tenant/agents/${agentId}/conversations/start${query}`,
      { channel: payload.channel, metadata: payload.metadata ?? {} },
    );
    return {
      agentInstanceId: readStringOrNull(response.agentInstanceId) ?? '',
      channel: normalizeStartableChannel(response.channel),
      retellAgentId: readStringOrNull(response.retellAgentId),
      retellConversationFlowId: readStringOrNull(response.retellConversationFlowId),
      startedAt: readStringOrNull(response.startedAt) ?? new Date().toISOString(),
    };
  },

  getDetails(id: string): AdminAgentDetail | null {
    return null;
  },

  async getAgentsForTenant(tenantId: string | undefined): Promise<TenantAgentRow[]> {
    if (!tenantId) return [];
    try {
      const data = await api.get<AgentInstanceApiResponse[]>('/tenant/agents');
      const rows: TenantAgentRow[] = [];
      for (const agent of data ?? []) {
        const channels = normalizeChannels(agent.channelsEnabled, agent.channel);
        const channel = channels[0] ?? 'chat';
        rows.push({
          id: typeof agent._id === 'string' ? agent._id : '',
          name: typeof agent.name === 'string' ? agent.name : '',
          channel,
          status: typeof agent.status === 'string' ? agent.status : 'paused',
          voice: '—',
          language: 'en',
          lastSynced:
            typeof agent.lastSyncedAt === 'string'
              ? agent.lastSyncedAt
              : typeof agent.deployedAt === 'string'
                ? agent.deployedAt
                : '—',
        });
      }
      return rows;
    } catch {
      return [];
    }
  },

  getAgentDetailFull(_tenantId: string | undefined, _agentId: string): AgentDetailFull | null {
    return null;
  },

  getAgentForTenant(_tenantId: string | undefined): TenantAgentDetail | null {
    return null;
  },
};

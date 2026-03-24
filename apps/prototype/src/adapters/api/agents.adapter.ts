/**
 * API agents adapter. Fetches agent data from backend.
 */

import { api } from '../../lib/apiClient';
import { ApiClientError } from '../../lib/apiClient';
import type {
  TenantAgentDetail,
  AdminAgentRow,
  AdminAgentDetail,
  TenantAgentRow,
  AgentDetailFull,
  AgentInstanceSummary,
  ChannelDeploymentSummary,
  AgentVoiceConfig,
  AgentChatConfig,
  AgentEmailConfig,
  AgentLlmConfig,
  AgentSkillRow,
  AgentPerformanceMetrics,
  AgentAbTest,
  AgentRunRow,
  AgentSyncInfo,
} from '../../shared/types';

interface AdminAgentsListResponse {
  data?: AgentInstanceApiResponse[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface AdminAgentsListParams {
  page?: number;
  limit?: number;
  status?: string;
  tenantId?: string | null;
}

export interface AdminAgentsListResult {
  data: AdminAgentRow[];
  total: number;
  page: number;
  limit: number;
}

interface AgentInstanceApiResponse extends Record<string, unknown> {
  _id?: string;
  baseAgentInstanceId?: string | null;
  linkedTenantCount?: number;
  tenantId?: string | Record<string, unknown>;
  name?: string;
  status?: string;
  channel?: string;
  channelsEnabled?: unknown;
  deployedAt?: string;
  lastSyncedAt?: string;
  createdAt?: string;
  retellAgentId?: string | null;
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

const DEFAULT_VOICE_CONFIG: AgentVoiceConfig = {
  voiceId: '',
  voiceName: '—',
  gender: '',
  accent: '',
  speakingRate: 1,
  stability: 0.75,
  similarityBoost: 0.85,
  fillerWords: true,
  interruptionSensitivity: 'Medium',
  ambientSound: false,
};

const DEFAULT_CHAT_CONFIG: AgentChatConfig = {
  status: 'Not Configured',
  channel: '',
  widgetEmbed: '',
  languages: [],
  fallbackBehavior: '',
  typingIndicator: false,
  responseDelay: 0,
};

const DEFAULT_EMAIL_CONFIG: AgentEmailConfig = {
  status: 'Not Configured',
  inboundEmail: '—',
  autoReply: '—',
  note: '',
};

const DEFAULT_LLM_CONFIG: AgentLlmConfig = {
  model: 'GPT-4o',
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 1024,
  customPromptEnabled: false,
  languageDetection: 'Auto',
  fallbackLanguage: 'English',
};

const DEFAULT_PERFORMANCE: AgentPerformanceMetrics = {
  totalCalls: 0,
  avgHandleTime: '—',
  successfulBookings: 0,
  escalations: 0,
  avgSentimentScore: 0,
  firstCallResolution: 0,
  interruptionRate: 0,
  silenceRate: 0,
};

const DEFAULT_AB_TEST: AgentAbTest = {
  status: 'Inactive',
  versionA: '',
  versionB: '',
  splitPercent: 50,
  started: '',
  winnerSoFar: '',
};

const DEFAULT_SYNC_INFO: AgentSyncInfo = {
  webhookUrl: '',
  lastWebhookEvent: '',
  webhookStatus: '—',
  autoSync: '—',
};

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

function mapAgentToRow(agent: AgentInstanceApiResponse): AdminAgentRow {
  const summary = toAgentInstanceSummary(agent);
  const retellAgentId =
    typeof agent.retellAgentId === 'string' && agent.retellAgentId.trim().length > 0
      ? agent.retellAgentId
      : null;
  return {
    id: summary.id,
    baseAgentInstanceId:
      typeof agent.baseAgentInstanceId === 'string' ? agent.baseAgentInstanceId : null,
    linkedTenantCount:
      typeof agent.linkedTenantCount === 'number' ? agent.linkedTenantCount : 0,
    name: summary.name,
    externalAgentId: summary.id,
    voice: summary.channelsEnabled.join(' + '),
    language: 'en',
    status: summary.status,
    tenantId: summary.tenantId,
    tenantName: summary.tenantName,
    lastSyncedAt: summary.lastSyncedAt ?? '',
    retellAgentId,
  };
}

export const agentsAdapter = {
  async list(params?: AdminAgentsListParams): Promise<AdminAgentsListResult> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const status = params?.status;
    const tenantId = params?.tenantId;
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (status) query.set('status', status);
    if (tenantId) query.set('tenantId', tenantId);
    try {
      const resp = await api.get<AdminAgentsListResponse>(`/admin/agents?${query.toString()}`);
      const items = resp?.data ?? [];
      return {
        data: items.map(mapAgentToRow),
        total: resp?.total ?? items.length,
        page: resp?.page ?? page,
        limit: resp?.limit ?? limit,
      };
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 304) {
        query.set('_', String(Date.now()));
        const resp = await api.get<AdminAgentsListResponse>(`/admin/agents?${query.toString()}`);
        const items = resp?.data ?? [];
        return {
          data: items.map(mapAgentToRow),
          total: resp?.total ?? items.length,
          page: resp?.page ?? page,
          limit: resp?.limit ?? limit,
        };
      }
      return { data: [], total: 0, page: 1, limit };
    }
  },

  async getTenantLinks(agentId: string): Promise<{
    baseAgentInstanceId: string;
    links: Array<{
      _id: string;
      tenantId: { _id: string; name?: string; slug?: string } | null;
      status: string;
      name: string;
      sourceAgentInstanceId?: string | null;
    }>;
  }> {
    return api.get(`/admin/agents/${agentId}/tenant-links`);
  },

  async listVoiceAgents(): Promise<AdminAgentRow[]> {
    const result = await this.list({ page: 1, limit: 200 });
    return result.data.filter((a) => a.tenantId != null && a.status !== 'available');
  },

  async assign(agentId: string, tenantId: string): Promise<void> {
    await api.post(`/admin/agents/${agentId}/assign`, { tenantId });
  },

  async unassign(agentId: string): Promise<void> {
    await api.post(`/admin/agents/${agentId}/unassign`);
  },

  async delete(
    agentId: string,
  ): Promise<{ agentInstanceId: string; retellWarnings: string[] }> {
    return api.delete<{ agentInstanceId: string; retellWarnings: string[] }>(
      `/admin/agents/${agentId}`,
    );
  },

  async updateAgent(agentId: string, data: { name?: string }): Promise<void> {
    await api.patch(`/admin/agents/${agentId}`, data);
  },

  async deploy(agentId: string): Promise<DeployAgentResponse> {
    return api.post<DeployAgentResponse>(`/admin/agents/${agentId}/deploy`);
  },

  /**
   * Syncs the agent config from Retell back to the platform.
   * Fetches the latest config from Retell and stores it in configSnapshot.
   */
  async syncFromRetell(agentId: string): Promise<void> {
    await api.get(`/admin/agents/${agentId}/retell-config`);
  },

  async createForTenant(
    tenantId: string,
    input: CreateAgentForTenantInput,
  ): Promise<AgentInstanceSummary> {
    const created = await api.post<AgentInstanceApiResponse>(`/admin/agents/tenants/${tenantId}`, input);
    return toAgentInstanceSummary(created);
  },

  async createUnassigned(input: CreateAgentForTenantInput): Promise<AgentInstanceSummary> {
    const created = await api.post<AgentInstanceApiResponse>('/admin/agents', input);
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

  /**
   * Fetches minimal agent data for redirect. Returns null on 401 or error.
   */
  async getAgentForRedirect(agentId: string): Promise<{ tenantId: string } | null> {
    try {
      const agent = await api.get<AgentInstanceApiResponse>(`/admin/agents/${agentId}`);
      const tenantId =
        typeof agent.tenantId === 'string'
          ? agent.tenantId
          : agent.tenantId && typeof agent.tenantId === 'object' && agent.tenantId !== null && '_id' in agent.tenantId
            ? String((agent.tenantId as Record<string, unknown>)._id)
            : null;
      return tenantId ? { tenantId } : null;
    } catch {
      return null;
    }
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

  /**
   * Fetches full agent detail from API for AgentDetailPage.
   * Syncs with Retell first if configured.
   */
  async getAgentDetailFullAsync(
    tenantId: string | undefined,
    agentId: string,
  ): Promise<AgentDetailFull | null> {
    if (!agentId) return null;
    try {
      let agent: AgentInstanceApiResponse;
      if (tenantId) {
        // Tenant context: sync then get (pass tenantId for TenantGuard when admin views tenant agent)
        try {
          await api.post(
            `/tenant/agents/${agentId}/sync?tenantId=${encodeURIComponent(tenantId)}`,
          );
        } catch {
          /* sync best-effort */
        }
        agent = await api.get<AgentInstanceApiResponse>(`/tenant/agents/${agentId}`);
      } else {
        // Admin context: sync via retell-config (which returns the agent)
        try {
          agent = await api.get<AgentInstanceApiResponse>(`/admin/agents/${agentId}/retell-config`);
        } catch {
          agent = await api.get<AgentInstanceApiResponse>(`/admin/agents/${agentId}`);
        }
      }

      const id = readStringOrNull(agent._id) ?? agentId;
      const tenantObj =
        agent.tenantId && typeof agent.tenantId === 'object'
          ? (agent.tenantId as Record<string, unknown>)
          : null;
      const tenantName =
        tenantObj && typeof tenantObj.name === 'string' ? tenantObj.name : '—';
      const resolvedTenantId =
        tenantObj && typeof tenantObj._id === 'string'
          ? tenantObj._id
          : tenantId ?? '';

      // Parse Retell config
      const customConfig =
        agent.configSnapshot && typeof agent.configSnapshot === 'object'
          ? (agent.configSnapshot as Record<string, unknown>)
          : {};
      const voiceConfig = { ...DEFAULT_VOICE_CONFIG };
      if (typeof customConfig.voice_id === 'string') {
        voiceConfig.voiceId = customConfig.voice_id;
      }
      if (typeof customConfig.voice_temperature === 'number') {
        voiceConfig.stability = customConfig.voice_temperature;
      }
      if (customConfig.ambient_sound) voiceConfig.ambientSound = true;
      if (typeof customConfig.language === 'string') {
        voiceConfig.language = customConfig.language;
      }
      
      const llmConfig = { ...DEFAULT_LLM_CONFIG };
      if (typeof customConfig.llm_websocket_url === 'string') {
        llmConfig.provider = customConfig.llm_websocket_url;
      }
      if (typeof customConfig.general_prompt === 'string') {
        llmConfig.systemPrompt = customConfig.general_prompt;
      }

      return {
        id,
        name: readStringOrNull(agent.name) ?? '—',
        retellAgentId: readStringOrNull(agent.retellAgentId) ?? '',
        tenantId: resolvedTenantId,
        tenantName,
        channel: normalizeChannel(agent.channel),
        createdAt: readStringOrNull(agent.createdAt) ?? '',
        lastSynced: readStringOrNull(agent.lastSyncedAt) ?? '',
        syncStatus: 'synced',
        voiceConfig,
        chatConfig: DEFAULT_CHAT_CONFIG,
        emailConfig: DEFAULT_EMAIL_CONFIG,
        llmConfig,
        skills: [] as AgentSkillRow[],
        performance: DEFAULT_PERFORMANCE,
        abTest: DEFAULT_AB_TEST,
        recentRuns: [] as AgentRunRow[],
        syncInfo: {
          ...DEFAULT_SYNC_INFO,
          lastSync: readStringOrNull(agent.lastSyncedAt) ?? '',
          status: 'synced',
          message: 'Synced successfully with Retell.',
        },
      };
    } catch {
      return null;
    }
  },

  getAgentForTenant(_tenantId: string | undefined): TenantAgentDetail | null {
    return null;
  },
};

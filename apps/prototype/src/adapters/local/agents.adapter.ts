/**
 * Local agents adapter. Admin list, assign, unassign; tenant-scoped detail.
 */

import {
  seedVoiceAgents,
  seedPlatformAgents,
  seedSkills,
  seedAgentSkills,
  seedTenants,
  seedAgentDetail,
  seedTenantDetail,
} from '../../mock/seedData';
import type {
  TenantAgentDetail,
  AdminAgentRow,
  AdminAgentDetail,
  TenantAgentRow,
  AgentDetailFull,
  ChannelDeploymentSummary,
  AgentInstanceSummary,
} from '../../shared/types';

const tenantName = (id: string) => seedTenants.find((t) => t.id === id)?.name ?? id;

function formatRelative(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

function buildAgentDetailFromRow(
  tenantId: string,
  row: { id: string; name: string; channel: string; status: string; voice: string; language: string; lastSynced: string }
): AgentDetailFull {
  const channel = row.channel === 'chat' ? 'chat' : row.channel === 'email' ? 'email' : 'voice';
  return {
    id: row.id,
    name: row.name,
    retellAgentId: row.id,
    tenantId,
    tenantName: seedTenantDetail.id === tenantId ? seedTenantDetail.profile.clinicName : tenantName(tenantId),
    channel,
    createdAt: '',
    lastSynced: row.lastSynced,
    syncStatus: 'In Sync',
    voiceConfig: {
      voiceId: '',
      voiceName: row.voice,
      gender: '',
      accent: '',
      speakingRate: 1,
      stability: 0.75,
      similarityBoost: 0.85,
      fillerWords: true,
      interruptionSensitivity: 'Medium',
      ambientSound: false,
    },
    chatConfig: {
      status: channel === 'chat' ? 'Active' : 'Not Configured',
      channel: channel === 'chat' ? 'Web Chat Widget' : '',
      widgetEmbed: '',
      languages: channel === 'chat' ? row.language.split(' + ') : [],
      fallbackBehavior: '',
      typingIndicator: false,
      responseDelay: 0,
    },
    emailConfig: {
      status: 'Not Configured',
      inboundEmail: '—',
      autoReply: '—',
      note: '',
    },
    llmConfig: {
      model: 'GPT-4o',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 1024,
      customPromptEnabled: false,
      languageDetection: 'Auto',
      fallbackLanguage: 'English',
    },
    skills: [],
    performance: {
      totalCalls: 0,
      avgHandleTime: '—',
      successfulBookings: 0,
      escalations: 0,
      avgSentimentScore: 0,
      firstCallResolution: 0,
      interruptionRate: 0,
      silenceRate: 0,
    },
    abTest: {
      status: 'Inactive',
      versionA: '',
      versionB: '',
      splitPercent: 50,
      started: '',
      winnerSoFar: '',
    },
    recentRuns: [],
    syncInfo: {
      webhookUrl: '',
      lastWebhookEvent: '',
      webhookStatus: '—',
      autoSync: '—',
    },
  };
}

/** In-memory: platform agents assigned/created for tenants. */
const assignedAgents: {
  id: string;
  platformAgentId: string;
  tenantId: string | null;
  voice: string;
  language: string;
  name?: string;
  status?: string;
  channelsEnabled?: Array<'voice' | 'chat' | 'email'>;
}[] = [];

export const agentsAdapter = {
  /** List all agents for admin. */
  list(): AdminAgentRow[] {
    const fromVoice = seedVoiceAgents.map((va) => ({
      id: va.id,
      name: va.voice,
      externalAgentId: va.externalAgentId,
      voice: va.voice,
      language: va.language,
      tenantId: va.tenantId,
      tenantName: tenantName(va.tenantId),
      status: va.status,
      lastSyncedAt: va.lastSyncedAt,
    }));
    const assignedPlatformIds = new Set(assignedAgents.map((a) => a.platformAgentId));
    const fromPlatform = seedPlatformAgents
      .filter((pa) => !assignedPlatformIds.has(pa.id))
      .map((pa) => ({
        id: pa.id,
        name: pa.name,
        externalAgentId: pa.id,
        voice: pa.voice,
        language: pa.language,
        tenantId: null,
        tenantName: null,
        status: 'available',
        lastSyncedAt: '—',
      }));
    const fromAssigned = assignedAgents.map((a) => ({
      id: a.id,
      name: a.name ?? a.voice,
      externalAgentId: a.id,
      voice: a.voice,
      language: a.language,
      tenantId: a.tenantId,
      tenantName: a.tenantId ? tenantName(a.tenantId) : null,
      status: a.status ?? 'active',
      lastSyncedAt: new Date().toISOString(),
    }));
    return [...fromVoice, ...fromPlatform, ...fromAssigned];
  },

  /** List only voice agents (deployed/assigned). For sandbox testing. Excludes unassigned platform agents. */
  listVoiceAgents(): AdminAgentRow[] {
    return [...this.list().filter((a) => a.tenantId != null && a.status !== 'available')];
  },

  /** Assign platform agent to tenant. */
  async assign(agentId: string, tenantId: string): Promise<void> {
    const existing = assignedAgents.find((item) => item.id === agentId);
    if (existing) {
      existing.tenantId = tenantId;
      existing.status = 'active';
      return;
    }
    const pa = seedPlatformAgents.find((p) => p.id === agentId);
    if (pa) {
      const defaultChannel: 'voice' | 'chat' | 'email' = 'chat';
      assignedAgents.push({
        id: `va_${Date.now()}`,
        platformAgentId: pa.id,
        tenantId,
        name: pa.name,
        voice: pa.voice,
        language: pa.language,
        status: 'active',
        channelsEnabled: [defaultChannel],
      });
    }
  },

  /** Unassign agent. */
  async unassign(agentId: string): Promise<void> {
    const existing = assignedAgents.find((item) => item.id === agentId);
    if (existing) {
      existing.tenantId = null;
      existing.status = 'paused';
    }
  },

  /** Update agent (e.g. name). */
  async updateAgent(agentId: string, data: { name?: string }): Promise<void> {
    const existing = assignedAgents.find((item) => item.id === agentId);
    if (existing && data.name != null && data.name.trim().length > 0) {
      existing.name = data.name.trim();
    }
  },

  async deploy(_agentId: string): Promise<{ status: string; message: string }> {
    return { status: 'queued', message: 'Deployment queued (local mode)' };
  },

  async createForTenant(
    tenantId: string,
    input: {
      templateId: string;
      name: string;
      channelsEnabled: Array<'voice' | 'chat' | 'email'>;
      capabilityLevel?: string;
    },
  ): Promise<AgentInstanceSummary> {
    const template = seedPlatformAgents.find((item) => item.id === input.templateId);
    const id = `ai_${Date.now()}`;
    const primaryChannel = input.channelsEnabled[0] ?? 'chat';
    assignedAgents.push({
      id,
      platformAgentId: input.templateId,
      tenantId,
      name: input.name,
      voice: template?.voice ?? primaryChannel,
      language: template?.language ?? input.capabilityLevel ?? 'en',
      status: 'paused',
      channelsEnabled: input.channelsEnabled,
    });
    return {
      id,
      tenantId,
      tenantName: tenantName(tenantId),
      name: input.name,
      status: 'paused',
      channel: primaryChannel,
      channelsEnabled: input.channelsEnabled,
      deployedAt: null,
      lastSyncedAt: null,
    };
  },

  async createUnassigned(input: {
    templateId: string;
    name: string;
    channelsEnabled: Array<'voice' | 'chat' | 'email'>;
    capabilityLevel?: string;
  }): Promise<AgentInstanceSummary> {
    const template = seedPlatformAgents.find((item) => item.id === input.templateId);
    const id = `ai_${Date.now()}`;
    const primaryChannel = input.channelsEnabled[0] ?? 'chat';
    assignedAgents.push({
      id,
      platformAgentId: input.templateId,
      tenantId: null,
      name: input.name,
      voice: template?.voice ?? primaryChannel,
      language: template?.language ?? input.capabilityLevel ?? 'en',
      status: 'paused',
      channelsEnabled: input.channelsEnabled,
    });
    return {
      id,
      tenantId: null,
      tenantName: null,
      name: input.name,
      status: 'paused',
      channel: primaryChannel,
      channelsEnabled: input.channelsEnabled,
      deployedAt: null,
      lastSyncedAt: null,
    };
  },

  async getDeployments(agentId: string): Promise<ChannelDeploymentSummary[]> {
    return [
      {
        id: `dep_${agentId}_voice`,
        channel: 'voice',
        provider: 'retell',
        status: 'active',
        retellAgentId: `retell_${agentId}`,
        retellConversationFlowId: `flow_${agentId}`,
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async getTenantDeployments(agentId: string): Promise<ChannelDeploymentSummary[]> {
    return this.getDeployments(agentId);
  },

  /** Get full agent detail for admin. */
  getDetails(id: string): AdminAgentDetail | null {
    const va = seedVoiceAgents.find((a) => a.id === id);
    const assigned = assignedAgents.find((a) => a.id === id);
    const pa = seedPlatformAgents.find((p) => p.id === id);
    if (!va && !assigned && !pa) return null;
    const source = va ?? assigned ?? pa;
    if (!source) return null;
    const skills = seedAgentSkills
      .filter((as) => as.agentId === id)
      .sort((a, b) => a.priority - b.priority)
      .map((as) => {
        const skill = seedSkills.find((s) => s.id === as.skillId);
        return { id: as.skillId, name: skill?.name ?? as.skillId, priority: as.priority };
      });
    const tid = va ? va.tenantId : assigned?.tenantId ?? null;
    const name = pa?.name ?? source.voice;
    const extId = 'externalAgentId' in source ? source.externalAgentId : source.id;
    const status = 'status' in source ? source.status : 'available';
    const lastSync = 'lastSyncedAt' in source ? source.lastSyncedAt : new Date().toISOString();
    return {
      id: source.id,
      name,
      externalAgentId: extId,
      voice: source.voice,
      language: source.language,
      tenantId: tid,
      tenantName: tid ? tenantName(tid) : null,
      status,
      lastSyncedAt: lastSync,
      enabledSkills: skills,
    };
  },

  /** Get all agents assigned to a tenant. Returns TenantAgentRow for TenantDetailPage. */
  getAgentsForTenant(tenantId: string | undefined): TenantAgentRow[] {
    if (!tenantId) return [];
    if (tenantId === seedTenantDetail.id) return seedTenantDetail.agents;
    const fromVoice = seedVoiceAgents
      .filter((va) => va.tenantId === tenantId)
      .map(
        (va): TenantAgentRow => ({
          id: va.id,
          name: va.voice,
          channel: 'voice',
          status: va.status,
          voice: va.voice,
          language: va.language,
          lastSynced: formatRelative(va.lastSyncedAt),
        })
      );
    const fromAssigned = assignedAgents
      .filter((a) => a.tenantId === tenantId)
      .map(
        (a): TenantAgentRow => ({
          id: a.id,
          name: a.voice,
          channel: 'voice',
          status: 'active',
          voice: a.voice,
          language: a.language,
          lastSynced: 'just now',
        })
      );
    return [...fromVoice, ...fromAssigned];
  },

  /** Async wrapper for AgentDetailPage; local mode returns sync result. */
  async getAgentDetailFullAsync(
    tenantId: string | undefined,
    agentId: string,
  ): Promise<AgentDetailFull | null> {
    return Promise.resolve(this.getAgentDetailFull(tenantId, agentId));
  },

  /** Get full agent detail for AgentDetailPage (Retell fields, channels, etc). */
  getAgentDetailFull(tenantId: string | undefined, agentId: string): AgentDetailFull | null {
    if (!tenantId || !agentId) return null;
    if (tenantId === 't_001' && agentId === 'va_001') return { ...seedAgentDetail };
    if (tenantId === seedTenantDetail.id) {
      const row = seedTenantDetail.agents.find((a) => a.id === agentId);
      if (row) return buildAgentDetailFromRow(tenantId, row);
    }
    const va = seedVoiceAgents.find((a) => a.id === agentId && a.tenantId === tenantId);
    const assigned = assignedAgents.find((a) => a.id === agentId && a.tenantId === tenantId);
    const source = va ?? assigned;
    if (!source) return null;
    const skills = seedAgentSkills
      .filter((as) => as.agentId === agentId)
      .sort((a, b) => a.priority - b.priority)
      .map((as) => {
        const skill = seedSkills.find((s) => s.id === as.skillId);
        return {
          id: as.skillId,
          name: skill?.name ?? as.skillId,
          enabled: true,
          priority: as.priority,
        };
      });
    const lastSync = 'lastSyncedAt' in source ? source.lastSyncedAt : new Date().toISOString();
    return {
      id: source.id,
      name: source.voice,
      retellAgentId: 'externalAgentId' in source ? source.externalAgentId : source.id,
      tenantId,
      tenantName: tenantName(tenantId),
      channel: 'voice',
      createdAt: '',
      lastSynced: formatRelative(lastSync),
      syncStatus: 'In Sync',
      voiceConfig: {
        voiceId: '',
        voiceName: source.voice,
        gender: '',
        accent: '',
        speakingRate: 1,
        stability: 0.75,
        similarityBoost: 0.85,
        fillerWords: true,
        interruptionSensitivity: 'Medium',
        ambientSound: false,
      },
      chatConfig: {
        status: 'Not Configured',
        channel: '',
        widgetEmbed: '',
        languages: [],
        fallbackBehavior: '',
        typingIndicator: false,
        responseDelay: 0,
      },
      emailConfig: {
        status: 'Not Configured',
        inboundEmail: '—',
        autoReply: '—',
        note: '',
      },
      llmConfig: {
        model: 'GPT-4o',
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 1024,
        customPromptEnabled: false,
        languageDetection: 'Auto',
        fallbackLanguage: 'English',
      },
      skills,
      performance: {
        totalCalls: 0,
        avgHandleTime: '—',
        successfulBookings: 0,
        escalations: 0,
        avgSentimentScore: 0,
        firstCallResolution: 0,
        interruptionRate: 0,
        silenceRate: 0,
      },
      abTest: {
        status: 'Inactive',
        versionA: '',
        versionB: '',
        splitPercent: 50,
        started: '',
        winnerSoFar: '',
      },
      recentRuns: [],
      syncInfo: {
        webhookUrl: '',
        lastWebhookEvent: '',
        webhookStatus: '—',
        autoSync: '—',
      },
    };
  },

  /** Get full agent detail for tenant (status, skills, sync). */
  getAgentForTenant(tenantId: string | undefined): TenantAgentDetail | null {
    if (!tenantId) return null;
    const va = seedVoiceAgents.find((a) => a.tenantId === tenantId);
    const assigned = assignedAgents.find((a) => a.tenantId === tenantId);
    const source = va ?? assigned;
    if (!source) return null;

    const enabledSkills = seedAgentSkills
      .filter((as) => as.agentId === source.id)
      .sort((a, b) => a.priority - b.priority)
      .map((as) => {
        const skill = seedSkills.find((s) => s.id === as.skillId);
        return {
          id: as.skillId,
          name: skill?.name ?? as.skillId,
          priority: as.priority,
        };
      });

    return {
      id: source.id,
      voice: source.voice,
      language: source.language,
      status: source.status === 'paused' || source.status === 'active' || source.status === 'archived' ? source.status : 'active',
      lastSyncedAt: 'lastSyncedAt' in source ? source.lastSyncedAt : new Date().toISOString(),
      enabledSkills,
    };
  },
};

/**
 * Local agents adapter. Admin list, assign, unassign; tenant-scoped detail.
 */

import {
  seedVoiceAgents,
  seedPlatformAgents,
  seedSkills,
  seedAgentSkills,
  seedTenants,
} from '../../mock/seedData';
import type { TenantAgentDetail, AdminAgentRow, AdminAgentDetail } from '../../shared/types';

const tenantName = (id: string) => seedTenants.find((t) => t.id === id)?.name ?? id;

/** In-memory: platform agents assigned to tenants. */
const assignedAgents: { id: string; platformAgentId: string; tenantId: string; voice: string; language: string }[] = [];

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
        tenantId: null as string | null,
        tenantName: null as string | null,
        status: 'available',
        lastSyncedAt: '—',
      }));
    const fromAssigned = assignedAgents.map((a) => ({
      id: a.id,
      name: a.voice,
      externalAgentId: a.id,
      voice: a.voice,
      language: a.language,
      tenantId: a.tenantId,
      tenantName: tenantName(a.tenantId),
      status: 'active',
      lastSyncedAt: new Date().toISOString(),
    }));
    return [...fromVoice, ...fromPlatform, ...fromAssigned];
  },

  /** List only voice agents (deployed/assigned). For sandbox testing. Excludes unassigned platform agents. */
  listVoiceAgents(): AdminAgentRow[] {
    return [...this.list().filter((a) => a.tenantId != null && a.status !== 'available')];
  },

  /** Assign platform agent to tenant. */
  assign(agentId: string, tenantId: string): void {
    const pa = seedPlatformAgents.find((p) => p.id === agentId);
    if (pa) {
      assignedAgents.push({
        id: `va_${Date.now()}`,
        platformAgentId: pa.id,
        tenantId,
        voice: pa.voice,
        language: pa.language,
      });
    }
  },

  /** Unassign agent. */
  unassign(agentId: string): void {
    const idx = assignedAgents.findIndex((a) => a.id === agentId);
    if (idx >= 0) assignedAgents.splice(idx, 1);
  },

  /** Get full agent detail for admin. */
  getDetails(id: string): AdminAgentDetail | null {
    const va = seedVoiceAgents.find((a) => a.id === id);
    const assigned = assignedAgents.find((a) => a.id === id);
    const pa = seedPlatformAgents.find((p) => p.id === id);
    if (!va && !assigned && !pa) return null;
    const source = va ?? assigned ?? pa!;
    const skills = seedAgentSkills
      .filter((as) => as.agentId === id)
      .sort((a, b) => a.priority - b.priority)
      .map((as) => {
        const skill = seedSkills.find((s) => s.id === as.skillId);
        return { id: as.skillId, name: skill?.name ?? as.skillId, priority: as.priority };
      });
    const tid = va ? va.tenantId : assigned?.tenantId ?? null;
    const name = 'voice' in source ? source.voice : (pa ? pa.name : source.voice);
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

  /** Get all agents assigned to a tenant (voice agents). */
  getAgentsForTenant(tenantId: string | undefined): { id: string; name: string; voice: string }[] {
    if (!tenantId) return [];
    const fromVoice = seedVoiceAgents
      .filter((va) => va.tenantId === tenantId)
      .map((va) => ({ id: va.id, name: va.voice, voice: va.voice }));
    const fromAssigned = assignedAgents
      .filter((a) => a.tenantId === tenantId)
      .map((a) => ({ id: a.id, name: a.voice, voice: a.voice }));
    return [...fromVoice, ...fromAssigned];
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
      status: 'status' in source ? source.status : 'active',
      lastSyncedAt: 'lastSyncedAt' in source ? source.lastSyncedAt : new Date().toISOString(),
      enabledSkills,
    };
  },
};

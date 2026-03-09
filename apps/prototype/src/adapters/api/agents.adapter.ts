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
} from '../../shared/types';

export const agentsAdapter = {
  async list(): Promise<AdminAgentRow[]> {
    try {
      const resp = await api.get<{ data: any[] }>('/admin/agents?page=1&limit=100');
      return (resp.data ?? []).map((a: any) => ({
        id: a._id,
        name: a.name ?? '',
        externalAgentId: a.externalAgentId ?? '',
        voice: a.voice ?? '',
        language: a.language ?? 'en',
        status: a.status ?? 'active',
        tenantId: typeof a.tenantId === 'string' ? a.tenantId : a.tenantId?._id ?? null,
        tenantName: a.tenantId?.name ?? null,
        lastSyncedAt: a.lastSyncedAt ?? '',
      }));
    } catch {
      return [];
    }
  },

  async listVoiceAgents(): Promise<AdminAgentRow[]> {
    const all = await this.list();
    return all.filter((a) => a.tenantId != null && a.status !== 'available');
  },

  assign(agentId: string, tenantId: string): void {
    api.post(`/admin/agents/${agentId}/assign`, { tenantId }).catch(() => {});
  },

  unassign(agentId: string): void {
    api.post(`/admin/agents/${agentId}/unassign`).catch(() => {});
  },

  getDetails(id: string): AdminAgentDetail | null {
    return null;
  },

  async getAgentsForTenant(tenantId: string | undefined): Promise<TenantAgentRow[]> {
    if (!tenantId) return [];
    try {
      const data = await api.get<any[]>('/tenant/agents');
      return (data ?? []).map((a: any) => ({
        id: a._id,
        name: a.name ?? '',
        channel: a.channel ?? 'voice',
        status: a.status ?? 'active',
        voice: a.voice ?? '',
        language: a.language ?? 'en',
        lastSynced: a.lastSyncedAt ?? '',
      }));
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

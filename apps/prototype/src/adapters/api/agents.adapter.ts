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

let cachedAdminAgents: AdminAgentRow[] = [];
let cachedTenantAgents: TenantAgentRow[] = [];

export const agentsAdapter = {
  list(): AdminAgentRow[] {
    return cachedAdminAgents;
  },

  listVoiceAgents(): AdminAgentRow[] {
    return cachedAdminAgents.filter((a) => a.tenantId != null && a.status !== 'available');
  },

  assign(agentId: string, tenantId: string): void {
    api.post(`/admin/agents/${agentId}/assign`, { tenantId }).catch(() => {});
  },

  unassign(agentId: string): void {
    api.post(`/admin/agents/${agentId}/unassign`).catch(() => {});
  },

  getDetails(id: string): AdminAgentDetail | null {
    const agent = cachedAdminAgents.find((a) => a.id === id);
    if (!agent) return null;
    return { ...agent, enabledSkills: [] };
  },

  getAgentsForTenant(tenantId: string | undefined): TenantAgentRow[] {
    if (!tenantId) return [];
    return cachedTenantAgents;
  },

  getAgentDetailFull(_tenantId: string | undefined, _agentId: string): AgentDetailFull | null {
    return null;
  },

  getAgentForTenant(_tenantId: string | undefined): TenantAgentDetail | null {
    return null;
  },

  async refresh(): Promise<void> {
    try {
      cachedTenantAgents = await api.get<TenantAgentRow[]>('/tenant/agents');
    } catch {
      // keep cache as-is
    }
  },

  async refreshAdmin(): Promise<void> {
    try {
      cachedAdminAgents = await api.get<AdminAgentRow[]>('/admin/agents');
    } catch {
      // keep cache as-is
    }
  },
};

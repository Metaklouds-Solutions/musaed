/**
 * Local runs adapter. Agent runs and run events for admin debug view.
 */

import { seedAgentRuns, seedRunEvents, seedTenants } from '../../mock/seedData';
import type { AgentRun, RunEvent } from '../../shared/types/entities';

export interface AdminRunRow {
  id: string;
  callId: string;
  tenantId: string;
  tenantName: string;
  cost: number;
  tokens?: number;
  startedAt: string;
}

function getTenantName(tenantId: string): string {
  const t = seedTenants.find((x) => x.id === tenantId);
  return t?.name ?? tenantId;
}

export const runsAdapter = {
  /**
   * List all runs (cross-tenant). Optional tenant filter.
   */
  async listRuns(tenantId?: string): Promise<AdminRunRow[]> {
    let runs = seedAgentRuns;
    if (tenantId) {
      runs = runs.filter((r) => r.tenantId === tenantId);
    }
    return runs.map((r) => ({
      id: r.id,
      callId: r.callId,
      tenantId: r.tenantId,
      tenantName: getTenantName(r.tenantId),
      cost: r.usage?.cost ?? 0,
      tokens: r.usage?.tokens,
      startedAt: r.startedAt,
    }));
  },

  /**
   * Get run by ID.
   */
  async getRun(id: string): Promise<AgentRun | null> {
    return seedAgentRuns.find((r) => r.id === id) ?? null;
  },

  /**
   * Get run by call ID for tenant call detail (auditor view). Optional tenantId for tenant scoping.
   */
  async getRunByCallId(callId: string, tenantId?: string): Promise<AgentRun | null> {
    let runs = seedAgentRuns.filter((r) => r.callId === callId);
    if (tenantId) runs = runs.filter((r) => r.tenantId === tenantId);
    return runs[0] ?? null;
  },

  /**
   * Get run events for debug console.
   */
  async getRunEvents(runId: string, _tenantId?: string): Promise<RunEvent[]> {
    return seedRunEvents
      .filter((e) => e.runId === runId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
};

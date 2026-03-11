/**
 * API runs adapter. Fetches agent runs and events from backend.
 */

import { api } from '../../lib/apiClient';
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

interface RunListResponse {
  data: {
    id: string;
    callId: string;
    tenantId: string;
    tenantName: string;
    cost: number;
    tokens?: number;
    startedAt: string;
    status: string;
  }[];
  total: number;
  page: number;
  limit: number;
}

export const runsAdapter = {
  /**
   * List all runs from the backend API with optional tenant filter.
   */
  listRuns(tenantId?: string): AdminRunRow[] {
    return [];
  },

  /**
   * Async version that returns a promise for API mode.
   */
  async listRunsAsync(tenantId?: string): Promise<AdminRunRow[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (tenantId) params.set('tenantId', tenantId);

      const res = await api.get<RunListResponse>(`/admin/runs?${params.toString()}`);
      const items = res?.data ?? [];
      return items.map((r) => ({
        id: r.id,
        callId: r.callId,
        tenantId: r.tenantId,
        tenantName: r.tenantName ?? r.tenantId,
        cost: r.cost ?? 0,
        tokens: r.tokens,
        startedAt: r.startedAt,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get run by ID.
   */
  getRun(id: string): AgentRun | null {
    return null;
  },

  /**
   * Async version for API mode.
   */
  async getRunAsync(id: string): Promise<AgentRun | null> {
    try {
      return await api.get<AgentRun>(`/admin/runs/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Get run by call ID.
   */
  getRunByCallId(callId: string, tenantId?: string): AgentRun | null {
    return null;
  },

  /**
   * Async version for API mode.
   */
  async getRunByCallIdAsync(callId: string, tenantId?: string): Promise<AgentRun | null> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      return await api.get<AgentRun>(`/admin/runs/by-call/${callId}${params}`);
    } catch {
      return null;
    }
  },

  /**
   * Get run events.
   */
  getRunEvents(runId: string): RunEvent[] {
    return [];
  },

  /**
   * Async version for API mode.
   */
  async getRunEventsAsync(runId: string): Promise<RunEvent[]> {
    try {
      const data = await api.get<RunEvent[]>(`/admin/runs/${runId}/events`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

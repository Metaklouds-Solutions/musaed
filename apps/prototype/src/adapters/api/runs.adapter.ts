/**
 * API runs adapter. Fetches agent runs and events from backend.
 */

import { api, ApiClientError } from '../../lib/apiClient';
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
   * List runs with optional tenant filter. Uses tenant endpoint when tenantId provided.
   */
  async listRuns(tenantId?: string): Promise<AdminRunRow[]> {
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (tenantId) params.set('tenantId', tenantId);

    const endpoint = tenantId ? '/tenant/runs' : '/admin/runs';
    const res = await api.get<RunListResponse>(`${endpoint}?${params.toString()}`);
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
  },

  /**
   * Get run by ID.
   */
  async getRun(id: string): Promise<AgentRun | null> {
    try {
      return await api.get<AgentRun>(`/admin/runs/${id}`);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 404) return null;
      throw e;
    }
  },

  /**
   * Get run by Retell call ID.
   */
  async getRunByCallId(callId: string, tenantId?: string): Promise<AgentRun | null> {
    const params = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    const endpoint = tenantId ? '/tenant/runs' : '/admin/runs';
    try {
      return await api.get<AgentRun>(`${endpoint}/by-call/${callId}${params}`);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 404) return null;
      throw e;
    }
  },

  /**
   * Get run events.
   */
  async getRunEvents(runId: string, tenantId?: string): Promise<RunEvent[]> {
    const params = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    const endpoint = tenantId ? '/tenant/runs' : '/admin/runs';
    const data = await api.get<RunEvent[]>(`${endpoint}/${runId}/events${params}`);
    return Array.isArray(data) ? data : [];
  },
};

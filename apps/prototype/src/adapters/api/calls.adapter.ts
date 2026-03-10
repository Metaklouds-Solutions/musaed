/**
 * API calls adapter. Calls data from backend (future: when call recording is wired).
 * Currently returns cached data. Refresh triggers backend fetch.
 */

import type { Call } from '../../shared/types';
import type { DateRangeFilter } from '../local/calls.adapter';
import { api } from '../../lib/apiClient';

interface CallsApiResponse {
  data: Call[];
  total: number;
  page: number;
  limit: number;
}

export const callsAdapter = {
  async getCalls(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<Call[]> {
    const endpoint = tenantId ? '/tenant/calls' : '/admin/calls';
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('from', dateRange.start.toISOString());
      params.append('to', dateRange.end.toISOString());
    }
    
    const res = await api.get<CallsApiResponse>(`${endpoint}?${params.toString()}`);
    // Map backend schema (_id, callId, etc) to frontend Call interface
    return res.data.map((c: any) => ({
      id: c._id,
      tenantId: c.tenantId?._id || c.tenantId,
      agentId: c.agentInstanceId?._id || c.agentInstanceId,
      customerName: 'Unknown', // Frontend mock map uses customerMap
      customerPhone: 'Unknown',
      status: c.status === 'started' ? 'in-progress' : (c.status === 'ended' || c.status === 'analyzed' ? 'completed' : c.status),
      duration: c.durationMs ? Math.round(c.durationMs / 1000) : 0,
      outcome: c.outcome,
      sentiment: c.sentiment || 'neutral',
      summary: c.summary,
      recordingUrl: c.recordingUrl,
      transcript: c.transcript,
      createdAt: c.createdAt,
    }));
  },

  async getCallById(id: string, tenantId: string | undefined): Promise<Call | undefined> {
    try {
      const endpoint = tenantId ? `/tenant/calls/${id}` : `/admin/calls/${id}`;
      // Enrich with Retell data
      const c: any = await api.get(`${endpoint}?enrich=true`);
      return {
        id: c._id,
        tenantId: c.tenantId?._id || c.tenantId,
        agentId: c.agentInstanceId?._id || c.agentInstanceId,
        customerName: 'Unknown',
        customerPhone: 'Unknown',
        status: c.status === 'started' ? 'in-progress' : (c.status === 'ended' || c.status === 'analyzed' ? 'completed' : c.status),
        duration: c.durationMs ? Math.round(c.durationMs / 1000) : 0,
        outcome: c.outcome,
        sentiment: c.sentiment || 'neutral',
        summary: c.summary,
        recordingUrl: c.recordingUrl,
        transcript: c.transcript,
        createdAt: c.createdAt,
      };
    } catch (e) {
      return undefined;
    }
  },

  async refresh(): Promise<void> {
    // Handled by react/async data reload
  },
};

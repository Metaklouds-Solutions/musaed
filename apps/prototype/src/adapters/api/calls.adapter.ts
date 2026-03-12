/**
 * API calls adapter. Maps backend call_sessions schema to frontend Call interface.
 */

import type { Call } from '../../shared/types';
import type { DateRangeFilter } from '../local/calls.adapter';
import { api } from '../../lib/apiClient';

interface CallsApiResponse {
  data: unknown[];
  total: number;
  page: number;
  limit: number;
}

/** Maps backend sentiment string to frontend sentimentScore (0–1). */
function sentimentToScore(sentiment: string | null | undefined): number {
  const s = (sentiment ?? 'neutral').toLowerCase().trim();
  if (s === 'positive') return 0.8;
  if (s === 'negative') return 0.2;
  return 0.5; // neutral, unknown, or empty
}

/** Maps backend outcome to bookingCreated and escalationFlag. */
function outcomeToFlags(outcome: string | null | undefined): {
  bookingCreated: boolean;
  escalationFlag: boolean;
} {
  const o = (outcome ?? 'unknown').toLowerCase().trim();
  return {
    bookingCreated: o === 'booked',
    escalationFlag: o === 'escalated',
  };
}

/** Resolves customerId from backend; fallback to callId when metadata not available. */
function resolveCustomerId(
  metadata: Record<string, unknown> | null | undefined,
  callId: string,
): string {
  const meta = metadata ?? {};
  const id = meta.customerId ?? meta.customer_id;
  if (typeof id === 'string' && id.trim().length > 0) return id.trim();
  return callId;
}

function mapBackendCallToFrontend(c: Record<string, unknown>): Call {
  const tenantId = c.tenantId as { _id?: string } | string | undefined;
  const tenantIdStr =
    typeof tenantId === 'object' && tenantId && '_id' in tenantId
      ? String(tenantId._id)
      : typeof tenantId === 'string'
        ? tenantId
        : String(c._id ?? '');

  const agentInstanceId = c.agentInstanceId as { _id?: string } | string | undefined;
  const agentIdStr =
    typeof agentInstanceId === 'object' && agentInstanceId && '_id' in agentInstanceId
      ? String(agentInstanceId._id)
      : typeof agentInstanceId === 'string'
        ? agentInstanceId
        : '';

  const callId = String(c.callId ?? c._id ?? '');
  const outcome = String(c.outcome ?? 'unknown');
  const sentiment = c.sentiment as string | null | undefined;
  const metadata = c.metadata as Record<string, unknown> | null | undefined;
  const { bookingCreated, escalationFlag } = outcomeToFlags(outcome);

  return {
    id: String(c._id ?? ''),
    tenantId: tenantIdStr,
    customerId: resolveCustomerId(metadata, callId),
    duration: c.durationMs != null ? Math.round(Number(c.durationMs) / 1000) : 0,
    sentimentScore: sentimentToScore(sentiment),
    transcript: typeof c.transcript === 'string' ? c.transcript : '',
    escalationFlag,
    bookingCreated,
    bookingId: c.bookingId ? String(c.bookingId) : undefined,
    createdAt: String(c.createdAt ?? ''),
    agentVersion: c.agentVersion as string | undefined,
    recordingUrl: typeof c.recordingUrl === 'string' ? c.recordingUrl : undefined,
    summary: typeof c.summary === 'string' ? c.summary : undefined,
    // Extra properties for compatibility with consumers that use them
    agentId: agentIdStr,
    outcome,
    sentiment: sentiment ?? 'neutral',
  };
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
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((c) => mapBackendCallToFrontend(c as Record<string, unknown>));
  },

  async getCallById(id: string, tenantId: string | undefined): Promise<Call | undefined> {
    try {
      const endpoint = tenantId ? `/tenant/calls/${id}` : `/admin/calls/${id}`;
      const c = (await api.get(`${endpoint}?enrich=true`)) as Record<string, unknown>;
      return mapBackendCallToFrontend(c);
    } catch {
      return undefined;
    }
  },

  async refresh(): Promise<void> {
    // Handled by react/async data reload
  },
};

/**
 * Local analytics adapter. Computes call analytics from seed data.
 * Used when VITE_DATA_MODE=local.
 */

import { callsAdapter } from './calls.adapter';
import type { AnalyticsQuery } from '../api/analytics.adapter';
import type { CallAnalyticsResponse } from '../api/analytics.adapter';

const EMPTY_RESPONSE: CallAnalyticsResponse = {
  totalCalls: 0,
  conversationRate: 0,
  avgDuration: 0,
  outcomes: {
    booked: 0,
    escalated: 0,
    failed: 0,
    info_only: 0,
    unknown: 0,
  },
  sentiment: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
};

function sentimentToBucket(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= 0.6) return 'positive';
  if (score <= 0.4) return 'negative';
  return 'neutral';
}

const VALID_OUTCOMES = ['booked', 'escalated', 'failed', 'info_only', 'unknown'] as const;

function outcomeFromCall(c: {
  bookingCreated?: boolean;
  escalationFlag?: boolean;
  outcome?: string;
  duration?: number;
  summary?: string;
}): (typeof VALID_OUTCOMES)[number] {
  const o = (c.outcome ?? '').toLowerCase().trim();
  if (VALID_OUTCOMES.includes(o as (typeof VALID_OUTCOMES)[number])) {
    return o as (typeof VALID_OUTCOMES)[number];
  }
  if (c.bookingCreated) return 'booked';
  if (c.escalationFlag) return 'escalated';
  if ((c.duration ?? 0) > 0 && (c.summary ?? '').trim().length > 0) return 'info_only';
  if ((c.duration ?? 0) === 0) return 'failed';
  return 'unknown';
}

/**
 * Computes tenant call analytics from local seed data.
 *
 * @param tenantId - Tenant ID to filter calls
 * @param query - Optional from, to, agentId
 */
export async function getTenantCallAnalytics(
  tenantId: string,
  query?: AnalyticsQuery,
): Promise<CallAnalyticsResponse> {
  const dateRange =
    query?.from && query?.to
      ? { start: new Date(query.from), end: new Date(query.to) }
      : undefined;
  const calls = await callsAdapter.getCalls(tenantId, dateRange, query?.agentId);
  return computeAnalytics(calls);
}

/**
 * Computes admin call analytics from local seed data (all tenants).
 *
 * @param query - Optional from, to, agentId, tenantId
 */
export async function getAdminCallAnalytics(
  query?: AnalyticsQuery,
): Promise<CallAnalyticsResponse> {
  const dateRange =
    query?.from && query?.to
      ? { start: new Date(query.from), end: new Date(query.to) }
      : undefined;
  const calls = await callsAdapter.getCalls(query?.tenantId, dateRange, query?.agentId);
  return computeAnalytics(calls);
}

function computeAnalytics(
  calls: {
    bookingCreated?: boolean;
    escalationFlag?: boolean;
    duration?: number;
    sentimentScore?: number;
    outcome?: string;
    summary?: string;
  }[],
): CallAnalyticsResponse {
  if (calls.length === 0) return EMPTY_RESPONSE;

  const totalCalls = calls.length;
  const booked = calls.filter((c) => c.bookingCreated).length;
  const totalDurationSec = calls.reduce((s, c) => s + (c.duration ?? 0), 0);
  const avgDuration = Math.round(totalDurationSec / totalCalls);
  const conversationRate = totalCalls > 0 ? booked / totalCalls : 0;

  const outcomes = {
    booked: 0,
    escalated: 0,
    failed: 0,
    info_only: 0,
    unknown: 0,
  };
  for (const c of calls) {
    const o = outcomeFromCall(c);
    if (o in outcomes) {
      (outcomes as Record<string, number>)[o]++;
    }
  }

  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const c of calls) {
    const bucket = sentimentToBucket(c.sentimentScore ?? 0.5);
    sentiment[bucket]++;
  }

  return {
    totalCalls,
    conversationRate,
    avgDuration,
    outcomes,
    sentiment,
  };
}

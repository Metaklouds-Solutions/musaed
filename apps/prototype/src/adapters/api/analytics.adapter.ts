/**
 * API analytics adapter. Fetches call analytics from backend.
 * Endpoints: GET /tenant/calls/analytics, GET /admin/calls/analytics
 */

import { api } from '../../lib/apiClient';

/** Query params for analytics endpoints. */
export interface AnalyticsQuery {
  from?: string;
  to?: string;
  agentId?: string;
  tenantId?: string;
}

/** Response shape from backend analytics endpoints. */
export interface CallAnalyticsResponse {
  totalCalls: number;
  conversationRate: number;
  avgDuration: number;
  outcomes: {
    booked: number;
    escalated: number;
    failed: number;
    info_only: number;
    unknown: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  /** Success rate (0–1). Optional until backend is deployed. */
  successRate?: number;
  /** Average cost per call. Optional until backend is deployed. */
  avgCost?: number;
  /** Average latency in ms. Optional until backend is deployed. */
  avgLatency?: number;
  /** Disconnection reason -> count. Optional until backend is deployed. */
  disconnectionReasons?: Record<string, number>;
}

/**
 * Fetches call analytics for the current tenant.
 * Calls GET /tenant/calls/analytics with optional from, to, agentId.
 * Tenant ID is resolved from JWT; tenantId param is for interface compatibility.
 *
 * @param _tenantId - Unused; tenant resolved from auth token
 * @param query - Optional filters (from, to, agentId)
 * @returns Analytics for the tenant's calls
 */
export async function getTenantCallAnalytics(
  _tenantId: string,
  query?: AnalyticsQuery,
): Promise<CallAnalyticsResponse> {
  const params = new URLSearchParams();
  if (query?.from) params.append('from', query.from);
  if (query?.to) params.append('to', query.to);
  if (query?.agentId) params.append('agentId', query.agentId);
  const qs = params.toString();
  const path = qs ? `/tenant/calls/analytics?${qs}` : '/tenant/calls/analytics';
  return api.get<CallAnalyticsResponse>(path);
}

/**
 * Fetches call analytics for admin (all tenants or filtered by tenantId).
 * Calls GET /admin/calls/analytics with optional from, to, agentId, tenantId.
 *
 * @param query - Optional filters (from, to, agentId, tenantId)
 * @returns Analytics across tenants
 */
export async function getAdminCallAnalytics(
  query?: AnalyticsQuery,
): Promise<CallAnalyticsResponse> {
  const params = new URLSearchParams();
  if (query?.from) params.append('from', query.from);
  if (query?.to) params.append('to', query.to);
  if (query?.agentId) params.append('agentId', query.agentId);
  if (query?.tenantId) params.append('tenantId', query.tenantId);
  const qs = params.toString();
  const path = qs ? `/admin/calls/analytics?${qs}` : '/admin/calls/analytics';
  return api.get<CallAnalyticsResponse>(path);
}

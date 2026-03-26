/**
 * Admin webhook observability: processed event ledger from GET /admin/webhooks/processed-events.
 */

import { api } from '../../lib/apiClient';
import type { WebhookEvent } from '../types/webhook-events';

interface ProcessedRow {
  eventId: string;
  source: string;
  eventType: string;
  processedAt: string;
}

interface ListResponse {
  data?: ProcessedRow[];
  total?: number;
}

function endpointForSource(source: string): string {
  if (source === 'retell') return '/webhooks/retell';
  if (source === 'stripe') return '/webhooks/stripe';
  if (source === 'calcom') return '/webhooks/calcom';
  return `/webhooks/${source}`;
}

/**
 * Lists processed webhook events (newest first). Async — use await in hooks.
 */
export async function listWebhookEvents(): Promise<WebhookEvent[]> {
  const res = await api.get<ListResponse>('/admin/webhooks/processed-events?limit=100&skip=0');
  const rows = res.data ?? [];
  return rows.map((row) => ({
    id: row.eventId,
    endpoint: endpointForSource(row.source),
    eventType: row.eventType,
    status: 'success' as const,
    statusCode: 200,
    attemptedAt: row.processedAt,
    retryCount: 0,
  }));
}

/**
 * Retrying processed ledger rows is not supported (events are idempotent by design).
 */
export async function retryWebhook(_id: string): Promise<boolean> {
  return false;
}

export const webhooksAdapter = {
  listWebhookEvents,
  retryWebhook,
};

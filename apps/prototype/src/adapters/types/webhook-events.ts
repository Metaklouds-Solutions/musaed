/**
 * Shared webhook event log types (local seed + API processed-events ledger).
 */

export type WebhookEventStatus = 'success' | 'failed' | 'pending';

export interface WebhookEvent {
  id: string;
  endpoint: string;
  eventType: string;
  status: WebhookEventStatus;
  statusCode?: number;
  attemptedAt: string;
  retryCount: number;
  lastError?: string;
}

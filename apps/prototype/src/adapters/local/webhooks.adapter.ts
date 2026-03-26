/**
 * Webhook event log. List calls, retry failed.
 */

import { seedWebhookEvents } from '../../mock/seedData';
import type { WebhookEvent } from '../types/webhook-events';

export type { WebhookEventStatus, WebhookEvent } from '../types/webhook-events';

/** In-memory events (seed + runtime retries). */
const events: WebhookEvent[] = seedWebhookEvents.map((e) => ({ ...e }));

export const webhooksAdapter = {
  /** List webhook events, newest first. */
  async listWebhookEvents(): Promise<WebhookEvent[]> {
    return [...events].sort(
      (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
    );
  },

  /** Retry a failed webhook. Updates status in-place (mock: simulates success). */
  async retryWebhook(id: string): Promise<boolean> {
    const ev = events.find((e) => e.id === id);
    if (!ev || ev.status !== 'failed') return false;
    ev.status = 'success';
    ev.statusCode = 200;
    ev.retryCount += 1;
    ev.lastError = undefined;
    ev.attemptedAt = new Date().toISOString();
    return true;
  },
};

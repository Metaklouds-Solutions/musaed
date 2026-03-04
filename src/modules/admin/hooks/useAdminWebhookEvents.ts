import { useState, useCallback } from 'react';
import { webhooksAdapter } from '../../../adapters';
import type { WebhookEvent } from '../../../adapters/local/webhooks.adapter';

/** Admin webhook events hook with refresh and retry actions. */
export function useAdminWebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>(() =>
    webhooksAdapter.listWebhookEvents()
  );
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setEvents(webhooksAdapter.listWebhookEvents());
  }, []);

  const retryWebhook = useCallback(
    (id: string) => {
      setRetryingId(id);
      const ok = webhooksAdapter.retryWebhook(id);
      if (ok) refresh();
      setRetryingId(null);
      return ok;
    },
    [refresh]
  );

  return { events, retryingId, retryWebhook };
}

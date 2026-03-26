import { useState, useCallback, useEffect } from 'react';
import { webhooksAdapter } from '../../../adapters';
import type { WebhookEvent } from '../../../adapters/types/webhook-events';

/** Admin webhook events hook with refresh and retry actions. */
export function useAdminWebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await webhooksAdapter.listWebhookEvents();
      setEvents(list);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const retryWebhook = useCallback(
    async (id: string) => {
      setRetryingId(id);
      try {
        const ok = await webhooksAdapter.retryWebhook(id);
        if (ok) await refresh();
        return ok;
      } finally {
        setRetryingId(null);
      }
    },
    [refresh]
  );

  return { events, loading, retryingId, retryWebhook, refresh };
}

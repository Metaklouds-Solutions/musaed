/**
 * Admin system health. Adapter only; platform-wide.
 * Returns extended health (Retell, DB, API, Webhooks).
 */

import { adminAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

/** Returns admin system health snapshot, preferring extended adapter fields when available. */
export function useAdminSystem() {
  const { data: systemHealth, loading } = useAsyncData(
    async () => {
      const summary = await adminAdapter.getDashboardSummary();
      const h = summary.health;
      return {
        status:
          h?.retellSync === 'error' || h?.webhooks === 'error'
            ? ('error' as const)
            : h?.retellSync === 'degraded' || h?.webhooks === 'degraded'
              ? ('degraded' as const)
              : ('ok' as const),
        integrations: [
          { name: 'Retell', status: h?.retellSync ?? 'ok' },
          { name: 'Webhooks', status: h?.webhooks ?? 'ok' },
        ],
      };
    },
    [],
    { status: 'ok' as const, integrations: [] },
  );
  return { systemHealth, loading };
}

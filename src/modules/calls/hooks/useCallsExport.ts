import { useCallback } from 'react';
import { exportAdapter } from '../../../adapters';
import type { Call } from '../../../shared/types';

/** Provides CSV export helper for tenant/admin call tables. */
export function useCallsExport() {
  const exportCallsCsv = useCallback(
    (calls: Call[], getCustomerName: (customerId: string) => string, fileName: string) => {
      const rows = calls.map((c) => ({
        Date: (() => {
          const parsed = new Date(c.createdAt);
          return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
        })(),
        Customer: getCustomerName(c.customerId),
        Duration: `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}`,
        Sentiment: c.sentimentScore.toFixed(2),
        Outcome: c.bookingCreated ? 'booked' : c.escalationFlag ? 'escalated' : 'failed',
      }));
      exportAdapter.exportCsv(rows, fileName);
    },
    []
  );

  return { exportCallsCsv };
}

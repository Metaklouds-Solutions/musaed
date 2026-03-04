/**
 * API alerts adapter (placeholder). Replace with real API when backend exists.
 */

import type { Alert } from '../../shared/types';

export const alertsAdapter = {
  getAlerts(_tenantId: string | undefined): Alert[] {
    return [];
  },

  resolveAlert(_alertId: string): void {
    // no-op until API exists
  },

  addSimulatedAlert(_tenantId: string | undefined): void {
    // no-op; real-time will come from socket/API
  },
};

/**
 * API alerts adapter. Alerts will come from backend events / websockets.
 * Currently returns cached data.
 */

import type { Alert } from '../../shared/types';

let cachedAlerts: Alert[] = [];

export const alertsAdapter = {
  getAlerts(_tenantId: string | undefined): Alert[] {
    return cachedAlerts;
  },

  resolveAlert(alertId: string): void {
    cachedAlerts = cachedAlerts.filter((a) => a.id !== alertId);
  },

  addSimulatedAlert(_tenantId: string | undefined): void {
    // no-op in API mode; alerts arrive from backend
  },

  async refresh(): Promise<void> {
    // Alerts endpoint not yet implemented; placeholder
    cachedAlerts = [];
  },
};

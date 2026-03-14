/**
 * API alerts adapter. Fetches alerts from backend.
 */

import { api } from '../../lib/apiClient';
import type { Alert } from '../../shared/types';

export const alertsAdapter = {
  async getAlerts(_tenantId: string | undefined): Promise<Alert[]> {
    try {
      const data = await api.get<Alert[]>('/tenant/alerts');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async resolveAlert(alertId: string): Promise<void> {
    await api.patch(`/tenant/alerts/${alertId}/resolve`);
  },

  addSimulatedAlert(_tenantId: string | undefined): void {
    // no-op in API mode; alerts arrive from backend
  },

  async refresh(): Promise<void> {
    // No-op; getAlerts fetches fresh each time
  },
};

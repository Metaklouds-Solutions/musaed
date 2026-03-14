/**
 * API maintenance adapter. Fetches maintenance status from backend.
 */

import { api, getAccessToken } from '../../lib/apiClient';

export const MAINTENANCE_CHANGED = 'clinic-crm-maintenance-changed';

export const maintenanceAdapter = {
  async getStatus(): Promise<{ enabled: boolean; message: string }> {
    try {
      const data = await api.get<{ enabled?: boolean; message?: string }>('/maintenance/status');
      return {
        enabled: data.enabled ?? false,
        message: data.message ?? 'System maintenance in progress. Some features may be temporarily unavailable.',
      };
    } catch {
      return { enabled: false, message: '' };
    }
  },

  isEnabled(): Promise<boolean> {
    return this.getStatus().then((s) => s.enabled);
  },

  getMessage(): Promise<string> {
    return this.getStatus().then((s) => s.message);
  },

  async setEnabled(enabled: boolean, message?: string): Promise<void> {
    const token = getAccessToken();
    if (!token) return;
    await api.patch<{ enabled: boolean; message: string }>('/admin/maintenance', { enabled, message });
    window.dispatchEvent(new CustomEvent(MAINTENANCE_CHANGED));
  },

  setMessage(_message: string): void {
    // Use setEnabled with current message
  },
};

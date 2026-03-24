/**
 * PMS connection metadata stored in tenant.settings.pms (stub until live EHR sync).
 */

import { api } from '../../lib/apiClient';
import type { PmsConnectionConfig, PmsProvider, PmsSyncResult } from '../local/pms.adapter';
import { getCachedPms, setCachedPms } from './tenantSettingsCache';

function isPmsProvider(s: unknown): s is PmsProvider {
  return s === 'athena' || s === 'epic' || s === 'cerner' || s === 'custom';
}

export const pmsAdapter = {
  getConfig(tenantId?: string): PmsConnectionConfig | null {
    if (!tenantId) return null;
    return getCachedPms(tenantId);
  },

  connect(provider: PmsProvider, tenantId?: string): PmsConnectionConfig {
    const config: PmsConnectionConfig = { provider, status: 'connected', lastSyncAt: undefined };
    if (tenantId) {
      setCachedPms(tenantId, config);
      void api.patch('/tenant/settings', { pms: config }).catch(() => {});
    }
    return config;
  },

  disconnect(tenantId?: string): PmsConnectionConfig {
    const current = tenantId ? getCachedPms(tenantId) : null;
    const config: PmsConnectionConfig = {
      provider: current?.provider && isPmsProvider(current.provider) ? current.provider : 'athena',
      status: 'disconnected',
      lastSyncAt: current?.lastSyncAt,
    };
    if (tenantId) {
      setCachedPms(tenantId, config);
      void api.patch('/tenant/settings', { pms: config }).catch(() => {});
    }
    return config;
  },

  async syncPatients(tenantId?: string): Promise<PmsSyncResult> {
    const config = tenantId ? getCachedPms(tenantId) : null;
    if (config?.status !== 'connected') {
      return Promise.resolve({ success: false, synced: 0, errors: ['Not connected'] });
    }
    const lastSyncAt = new Date().toISOString();
    const next = { ...config, lastSyncAt };
    if (tenantId) {
      setCachedPms(tenantId, next);
      await api.patch('/tenant/settings', { pms: next }).catch(() => {});
    }
    return { success: true, synced: 0 };
  },

  async syncAppointments(tenantId?: string): Promise<PmsSyncResult> {
    return this.syncPatients(tenantId);
  },
};

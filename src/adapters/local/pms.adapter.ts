/**
 * PMS (Practice Management System) adapter. Stubs for future integrations (Athena, Epic, etc.).
 */

export type PmsProvider = 'athena' | 'epic' | 'cerner' | 'custom';

export interface PmsConnectionConfig {
  provider: PmsProvider;
  status: 'connected' | 'disconnected';
  lastSyncAt?: string;
}

export interface PmsSyncResult {
  success: boolean;
  synced: number;
  errors?: string[];
}

const PMS_CONFIG_KEY = 'clinic-crm-pms-config';

function loadConfig(tenantId?: string): PmsConnectionConfig | null {
  try {
    const key = tenantId ? `${PMS_CONFIG_KEY}-${tenantId}` : PMS_CONFIG_KEY;
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as PmsConnectionConfig) : null;
  } catch {
    return null;
  }
}

function saveConfig(config: PmsConnectionConfig, tenantId?: string): void {
  try {
    const key = tenantId ? `${PMS_CONFIG_KEY}-${tenantId}` : PMS_CONFIG_KEY;
    localStorage.setItem(key, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export const pmsAdapter = {
  getConfig(tenantId?: string): PmsConnectionConfig | null {
    return loadConfig(tenantId);
  },

  connect(provider: PmsProvider, tenantId?: string): PmsConnectionConfig {
    const config: PmsConnectionConfig = { provider, status: 'connected', lastSyncAt: undefined };
    saveConfig(config, tenantId);
    return config;
  },

  disconnect(tenantId?: string): PmsConnectionConfig {
    const current = loadConfig(tenantId);
    const config: PmsConnectionConfig = {
      provider: current?.provider ?? 'athena',
      status: 'disconnected',
      lastSyncAt: current?.lastSyncAt,
    };
    saveConfig(config, tenantId);
    return config;
  },

  syncPatients(tenantId?: string): Promise<PmsSyncResult> {
    const config = loadConfig(tenantId);
    if (config?.status !== 'connected') {
      return Promise.resolve({ success: false, synced: 0, errors: ['Not connected'] });
    }
    const lastSyncAt = new Date().toISOString();
    saveConfig({ ...config, lastSyncAt }, tenantId);
    return Promise.resolve({ success: true, synced: 0 });
  },

  syncAppointments(tenantId?: string): Promise<PmsSyncResult> {
    const config = loadConfig(tenantId);
    if (config?.status !== 'connected') {
      return Promise.resolve({ success: false, synced: 0, errors: ['Not connected'] });
    }
    const lastSyncAt = new Date().toISOString();
    saveConfig({ ...config, lastSyncAt }, tenantId);
    return Promise.resolve({ success: true, synced: 0 });
  },
};

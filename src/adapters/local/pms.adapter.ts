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

function isPmsProvider(s: unknown): s is PmsProvider {
  return s === 'athena' || s === 'epic' || s === 'cerner' || s === 'custom';
}

function isPmsConnectionConfig(x: unknown): x is PmsConnectionConfig {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    isPmsProvider(o.provider) &&
    (o.status === 'connected' || o.status === 'disconnected') &&
    (o.lastSyncAt === undefined || typeof o.lastSyncAt === 'string')
  );
}

function parsePmsConfig(raw: string): PmsConnectionConfig | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPmsConnectionConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadConfig(tenantId?: string): PmsConnectionConfig | null {
  const key = tenantId ? `${PMS_CONFIG_KEY}-${tenantId}` : PMS_CONFIG_KEY;
  const stored = localStorage.getItem(key);
  return stored ? parsePmsConfig(stored) : null;
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

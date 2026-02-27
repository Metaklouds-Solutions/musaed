/**
 * Local settings adapter. Admin and tenant settings. Uses localStorage for persistence.
 */

import { seedTenantSettings } from '../../mock/seedData';

const ADMIN_SETTINGS_KEY = 'clinic-crm-admin-settings';
const TENANT_SETTINGS_KEY = 'clinic-crm-tenant-settings';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  lastActive?: string;
}

export interface AdminIntegration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  config?: Record<string, string>;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  days: number;
  enabled: boolean;
}

export interface AdminSettings {
  adminUsers: AdminUser[];
  integrations: AdminIntegration[];
  retentionPolicies: RetentionPolicy[];
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  businessHours: string;
  greetingMessage?: string;
  agentName?: string;
  notifications: {
    emailDigest: boolean;
    ticketAlerts: boolean;
    bookingReminders: boolean;
  };
}

const defaultAdminSettings: AdminSettings = {
  adminUsers: [
    { id: 'admin_1', email: 'admin@example.com', role: 'Platform Admin', lastActive: '2026-02-27T10:00:00Z' },
    { id: 'admin_2', email: 'support@example.com', role: 'Support', lastActive: '2026-02-26T15:30:00Z' },
  ],
  integrations: [
    { id: 'retell', name: 'Retell API', status: 'connected', config: { apiKey: '••••••••••••' } },
    { id: 'webhooks', name: 'Webhooks', status: 'connected' },
  ],
  retentionPolicies: [
    { id: 'rp_1', name: 'Call transcripts', days: 90, enabled: true },
    { id: 'rp_2', name: 'Audit logs', days: 365, enabled: true },
  ],
};

const defaultTenantSettings: TenantSettings = {
  timezone: 'America/New_York',
  locale: 'en-US',
  businessHours: 'Mon–Fri 9am–5pm',
  greetingMessage: "Hello, thank you for calling. I'm your AI assistant. How can I help you today?",
  agentName: 'Alex (Professional & Empathetic)',
  notifications: {
    emailDigest: true,
    ticketAlerts: true,
    bookingReminders: true,
  },
};

function load<T>(key: string, tenantId?: string): T | null {
  try {
    const stored = localStorage.getItem(tenantId ? `${key}-${tenantId}` : key);
    return stored ? (JSON.parse(stored) as T) : null;
  } catch {
    return null;
  }
}

function save<T>(key: string, value: T, tenantId?: string): void {
  try {
    localStorage.setItem(tenantId ? `${key}-${tenantId}` : key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const settingsAdapter = {
  /** Get admin settings (platform-wide). */
  getAdminSettings(): AdminSettings {
    return load<AdminSettings>(ADMIN_SETTINGS_KEY) ?? defaultAdminSettings;
  },

  /** Save admin settings. */
  saveAdminSettings(settings: AdminSettings): void {
    save(ADMIN_SETTINGS_KEY, settings);
  },

  /** Get tenant settings. Merges with seed when tenantId provided and no stored override. */
  getTenantSettings(tenantId?: string): TenantSettings {
    const stored = tenantId ? load<TenantSettings>(TENANT_SETTINGS_KEY, tenantId) : load<TenantSettings>(TENANT_SETTINGS_KEY);
    if (stored) return stored;
    const seed = tenantId ? seedTenantSettings.find((s) => s.tenantId === tenantId) : null;
    return {
      ...defaultTenantSettings,
      ...(seed && {
        timezone: seed.timezone,
        locale: seed.locale,
        businessHours: seed.businessHours,
      }),
    };
  },

  /** Save tenant settings. */
  saveTenantSettings(settings: TenantSettings, tenantId?: string): void {
    save(TENANT_SETTINGS_KEY, settings, tenantId);
  },
};

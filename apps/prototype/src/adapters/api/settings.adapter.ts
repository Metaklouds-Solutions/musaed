/**
 * API settings adapter. Fetches tenant settings from backend.
 */

import { api } from '../../lib/apiClient';

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

export interface AppointmentRemindersConfig {
  advanceMinutes: number;
  channel: 'email' | 'sms';
}

export interface AgentPromptConfig {
  greetingMessage?: string;
  agentName?: string;
  systemPrompt?: string;
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  businessHours: string;
  greetingMessage?: string;
  agentName?: string;
  systemPrompt?: string;
  agentPrompts?: Record<string, AgentPromptConfig>;
  notifications: {
    emailDigest: boolean;
    ticketAlerts: boolean;
    bookingReminders: boolean;
  };
  appointmentReminders?: AppointmentRemindersConfig;
  pmsEnabled?: boolean;
}

const defaultAdminSettings: AdminSettings = {
  adminUsers: [],
  integrations: [],
  retentionPolicies: [],
};

const defaultTenantSettings: TenantSettings = {
  timezone: 'Asia/Riyadh',
  locale: 'ar',
  businessHours: 'Mon–Fri 9am–5pm',
  notifications: { emailDigest: true, ticketAlerts: true, bookingReminders: true },
};

let cachedTenantSettings: TenantSettings | null = null;

export const settingsAdapter = {
  getAdminSettings(): AdminSettings {
    return defaultAdminSettings;
  },

  saveAdminSettings(_settings: AdminSettings): void {
    // future: api.patch('/admin/settings', settings)
  },

  getTenantSettings(_tenantId?: string): TenantSettings {
    return cachedTenantSettings ?? defaultTenantSettings;
  },

  saveTenantSettings(settings: TenantSettings, _tenantId?: string): void {
    cachedTenantSettings = settings;
    api.patch('/tenant/settings', settings).catch(() => {});
  },

  getAgentPrompts(tenantId: string | undefined, _agentId: string): AgentPromptConfig {
    const s = this.getTenantSettings(tenantId);
    return {
      greetingMessage: s.greetingMessage ?? defaultTenantSettings.greetingMessage,
      agentName: s.agentName,
      systemPrompt: s.systemPrompt,
    };
  },

  async refresh(): Promise<void> {
    try {
      cachedTenantSettings = await api.get<TenantSettings>('/tenant/settings');
    } catch {
      // keep cache as-is
    }
  },
};

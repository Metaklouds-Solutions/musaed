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

export const settingsAdapter = {
  getAdminSettings(): AdminSettings {
    return defaultAdminSettings;
  },

  saveAdminSettings(_settings: AdminSettings): void {},

  async getTenantSettings(tenantId?: string): Promise<TenantSettings> {
    try {
      const data = await api.get<any>('/tenant/settings');
      return {
        timezone: data.timezone ?? defaultTenantSettings.timezone,
        locale: data.locale ?? defaultTenantSettings.locale,
        businessHours: data.settings?.businessHours ?? defaultTenantSettings.businessHours,
        notifications: data.settings?.notifications ?? defaultTenantSettings.notifications,
      };
    } catch {
      return defaultTenantSettings;
    }
  },

  async saveTenantSettings(settings: TenantSettings, _tenantId?: string): Promise<void> {
    await api.patch('/tenant/settings', settings);
  },

  getAgentPrompts(tenantId: string | undefined, _agentId: string): AgentPromptConfig {
    return { greetingMessage: '', agentName: '', systemPrompt: '' };
  },
};

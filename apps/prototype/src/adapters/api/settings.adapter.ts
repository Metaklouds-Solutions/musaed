/**
 * API settings adapter. Fetches tenant settings from backend.
 */

import { api } from '../../lib/apiClient';
import { primeTenantSettingsCaches } from './tenantSettingsCache';

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
  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const data = await api.get<{ retentionPolicies?: AdminSettings['retentionPolicies']; integrations?: AdminSettings['integrations'] }>('/admin/settings');
      return {
        adminUsers: defaultAdminSettings.adminUsers,
        integrations: data.integrations ?? defaultAdminSettings.integrations,
        retentionPolicies: data.retentionPolicies ?? defaultAdminSettings.retentionPolicies,
      };
    } catch {
      return defaultAdminSettings;
    }
  },

  async saveAdminSettings(settings: AdminSettings): Promise<void> {
    await api.patch('/admin/settings/retention', { policies: settings.retentionPolicies });
    await api.patch('/admin/settings/integrations', { integrations: settings.integrations });
  },

  async getTenantSettings(tenantId?: string): Promise<TenantSettings> {
    try {
      const data = await api.get<{
        timezone?: string;
        locale?: string;
        settings?: {
          businessHours?: string | Record<string, unknown>;
          notifications?: { emailDigest?: boolean; ticketAlerts?: boolean; bookingReminders?: boolean };
          appointmentReminders?: { advanceMinutes?: number; channel?: string };
        };
      }>('/tenant/settings');
      if (tenantId) {
        primeTenantSettingsCaches(tenantId, data);
      }
      const bh = data.settings?.businessHours;
      const businessHours = typeof bh === 'string' ? bh : defaultTenantSettings.businessHours;
      return {
        timezone: data.timezone ?? defaultTenantSettings.timezone,
        locale: data.locale ?? defaultTenantSettings.locale,
        businessHours,
        notifications: data.settings?.notifications ?? defaultTenantSettings.notifications,
        appointmentReminders: data.settings?.appointmentReminders ?? { advanceMinutes: 60, channel: 'email' },
      };
    } catch {
      return defaultTenantSettings;
    }
  },

  async saveTenantSettings(settings: TenantSettings, _tenantId?: string): Promise<void> {
    await api.patch('/tenant/settings', {
      timezone: settings.timezone,
      locale: settings.locale,
      businessHours: settings.businessHours,
      notifications: settings.notifications,
      appointmentReminders: settings.appointmentReminders,
    });
  },

  getAgentPrompts(tenantId: string | undefined, _agentId: string): AgentPromptConfig {
    return { greetingMessage: '', agentName: '', systemPrompt: '' };
  },
};

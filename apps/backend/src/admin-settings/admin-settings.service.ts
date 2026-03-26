import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminConfig,
  AdminConfigDocument,
} from './schemas/admin-config.schema';
const DEFAULT_RETENTION = [
  { id: 'rp_1', name: 'Call transcripts', days: 90, enabled: true },
  { id: 'rp_2', name: 'Audit logs', days: 365, enabled: true },
];

const DEFAULT_INTEGRATIONS = [
  { id: 'retell', name: 'Retell API', status: 'disconnected', config: {} },
  { id: 'webhooks', name: 'Webhooks', status: 'disconnected', config: {} },
];

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectModel(AdminConfig.name)
    private configModel: Model<AdminConfigDocument>,
  ) {}

  private async getOrCreate(): Promise<AdminConfigDocument> {
    let doc = await this.configModel.findOne({ key: 'default' });
    if (!doc) {
      doc = await this.configModel.create({
        key: 'default',
        retentionPolicies: DEFAULT_RETENTION,
        integrations: DEFAULT_INTEGRATIONS,
      });
    }
    return doc;
  }

  async getRetentionPolicies(): Promise<
    { id: string; name: string; days: number; enabled: boolean }[]
  > {
    const doc = await this.getOrCreate();
    const policies = doc.retentionPolicies ?? DEFAULT_RETENTION;
    return policies.map((p) => ({
      id: p.id,
      name: p.name,
      days: p.days,
      enabled: p.enabled,
    }));
  }

  async updateRetentionPolicy(
    id: string,
    updates: { enabled?: boolean; days?: number },
  ): Promise<void> {
    const doc = await this.getOrCreate();
    const policies = [...(doc.retentionPolicies ?? DEFAULT_RETENTION)];
    const idx = policies.findIndex((p) => p.id === id);
    if (idx >= 0) {
      if (updates.enabled !== undefined)
        policies[idx].enabled = updates.enabled;
      if (updates.days !== undefined)
        policies[idx].days = Math.max(1, Math.min(3650, updates.days));
      await this.configModel.updateOne(
        { key: 'default' },
        { $set: { retentionPolicies: policies } },
      );
    }
  }

  async setRetentionPolicies(
    policies: { id: string; name: string; days: number; enabled: boolean }[],
  ): Promise<void> {
    await this.configModel.updateOne(
      { key: 'default' },
      { $set: { retentionPolicies: policies } },
      { upsert: true },
    );
  }

  async getIntegrations(): Promise<
    {
      id: string;
      name: string;
      status: string;
      config?: Record<string, string>;
    }[]
  > {
    const doc = await this.getOrCreate();
    const integrations = doc.integrations ?? DEFAULT_INTEGRATIONS;
    return integrations.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
      config: i.config,
    }));
  }

  async updateIntegrations(
    integrations: {
      id: string;
      name: string;
      status: string;
      config?: Record<string, string>;
    }[],
  ): Promise<void> {
    await this.configModel.updateOne(
      { key: 'default' },
      { $set: { integrations } },
      { upsert: true },
    );
  }

  async getFullSettings(): Promise<{
    retentionPolicies: {
      id: string;
      name: string;
      days: number;
      enabled: boolean;
    }[];
    integrations: {
      id: string;
      name: string;
      status: string;
      config?: Record<string, string>;
    }[];
    scheduledReportConfig?: {
      enabled: boolean;
      frequency: string;
      recipients: string[];
      dayOfWeek: number;
      dayOfMonth: number;
    };
  }> {
    const [retentionPolicies, integrations, doc] = await Promise.all([
      this.getRetentionPolicies(),
      this.getIntegrations(),
      this.getOrCreate(),
    ]);
    const cfg = doc.scheduledReportConfig;
    return {
      retentionPolicies,
      integrations,
      scheduledReportConfig: cfg
        ? {
            enabled: cfg.enabled,
            frequency: cfg.frequency ?? 'weekly',
            recipients: cfg.recipients ?? [],
            dayOfWeek: cfg.dayOfWeek ?? 1,
            dayOfMonth: cfg.dayOfMonth ?? 1,
          }
        : undefined,
    };
  }

  async getScheduledReportConfig(): Promise<{
    enabled: boolean;
    frequency: string;
    recipients: string[];
    dayOfWeek: number;
    dayOfMonth: number;
  }> {
    const doc = await this.getOrCreate();
    const cfg = doc.scheduledReportConfig;
    return cfg
      ? {
          enabled: cfg.enabled,
          frequency: cfg.frequency ?? 'weekly',
          recipients: cfg.recipients ?? [],
          dayOfWeek: cfg.dayOfWeek ?? 1,
          dayOfMonth: cfg.dayOfMonth ?? 1,
        }
      : {
          enabled: false,
          frequency: 'weekly',
          recipients: [],
          dayOfWeek: 1,
          dayOfMonth: 1,
        };
  }

  async setScheduledReportConfig(config: {
    enabled?: boolean;
    frequency?: string;
    recipients?: string[];
    dayOfWeek?: number;
    dayOfMonth?: number;
  }): Promise<void> {
    const doc = await this.getOrCreate();
    const current = doc.scheduledReportConfig ?? {
      enabled: false,
      frequency: 'weekly',
      recipients: [],
      dayOfWeek: 1,
      dayOfMonth: 1,
    };
    await this.configModel.updateOne(
      { key: 'default' },
      {
        $set: {
          scheduledReportConfig: {
            enabled: config.enabled ?? current.enabled,
            frequency: config.frequency ?? current.frequency,
            recipients: config.recipients ?? current.recipients,
            dayOfWeek: config.dayOfWeek ?? current.dayOfWeek,
            dayOfMonth: config.dayOfMonth ?? current.dayOfMonth,
          },
        },
      },
      { upsert: true },
    );
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminConfigDocument = AdminConfig & Document;

@Schema({ _id: false })
export class RetentionPolicyItemSchema {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 90 })
  days: number;

  @Prop({ default: true })
  enabled: boolean;
}

@Schema({ _id: false })
export class IntegrationItemSchema {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'disconnected' })
  status: string;

  @Prop({ type: Object, default: {} })
  config: Record<string, string>;
}

@Schema({ _id: false })
export class ScheduledReportConfigSchema {
  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: 'weekly' })
  frequency: string;

  @Prop({ type: [String], default: [] })
  recipients: string[];

  @Prop({ default: 1 })
  dayOfWeek: number;

  @Prop({ default: 1 })
  dayOfMonth: number;
}

@Schema({ timestamps: true, collection: 'admin_config' })
export class AdminConfig {
  @Prop({ default: 'default' })
  key: string;

  @Prop({ type: [Object], default: [] })
  retentionPolicies: {
    id: string;
    name: string;
    days: number;
    enabled: boolean;
  }[];

  @Prop({ type: [Object], default: [] })
  integrations: {
    id: string;
    name: string;
    status: string;
    config?: Record<string, string>;
  }[];

  @Prop({
    type: Object,
    default: () => ({
      enabled: false,
      frequency: 'weekly',
      recipients: [],
      dayOfWeek: 1,
      dayOfMonth: 1,
    }),
  })
  scheduledReportConfig?: {
    enabled: boolean;
    frequency: string;
    recipients: string[];
    dayOfWeek: number;
    dayOfMonth: number;
  };
}

export const AdminConfigSchema = SchemaFactory.createForClass(AdminConfig);

AdminConfigSchema.index({ key: 1 }, { unique: true });

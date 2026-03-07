import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ _id: false })
export class TenantSettings {
  @Prop({ type: Object, default: {} })
  businessHours: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  notifications: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  featureFlags: Record<string, unknown>;

  @Prop({ type: [Object], default: [] })
  locations: Record<string, unknown>[];
}

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true, enum: ['ONBOARDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ default: null })
  stripeCustomerId: string | null;

  @Prop({ default: null })
  stripeSubscriptionId: string | null;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', default: null })
  planId: Types.ObjectId | null;

  @Prop({ default: 'Asia/Riyadh' })
  timezone: string;

  @Prop({ default: 'ar' })
  locale: string;

  @Prop({ default: 0 })
  onboardingStep: number;

  @Prop({ default: false })
  onboardingComplete: boolean;

  @Prop({ type: TenantSettings, default: () => ({}) })
  settings: TenantSettings;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ status: 1 });

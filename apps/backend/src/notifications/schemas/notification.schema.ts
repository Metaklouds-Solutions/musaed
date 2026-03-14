import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
  tenantId: Types.ObjectId | null;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 'system' })
  source: string;

  @Prop({ default: 'info' })
  severity: 'critical' | 'important' | 'normal' | 'info';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: '' })
  link: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date | null;

  @Prop({ default: 'normal' })
  priority: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ tenantId: 1 });
NotificationSchema.index({ tenantId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ severity: 1, createdAt: -1 });
NotificationSchema.index({ source: 1, createdAt: -1 });

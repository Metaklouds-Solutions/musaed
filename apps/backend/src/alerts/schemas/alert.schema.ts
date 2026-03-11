import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: true, collection: 'alerts' })
export class Alert {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'medium' })
  severity: string;

  @Prop({ default: false })
  resolved: boolean;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

AlertSchema.index({ tenantId: 1 });
AlertSchema.index({ resolved: 1 });
AlertSchema.index({ tenantId: 1, createdAt: -1 });

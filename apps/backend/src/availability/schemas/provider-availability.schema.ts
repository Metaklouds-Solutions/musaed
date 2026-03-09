import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProviderAvailabilityDocument = ProviderAvailability & Document;

@Schema({ timestamps: true, collection: 'provider_availability' })
export class ProviderAvailability {
  @Prop({ type: Types.ObjectId, ref: 'TenantStaff', required: true })
  providerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true }) // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfWeek: number;

  @Prop({ required: true }) // "09:00"
  startTime: string;

  @Prop({ required: true }) // "17:00"
  endTime: string;
}

export const ProviderAvailabilitySchema = SchemaFactory.createForClass(ProviderAvailability);

ProviderAvailabilitySchema.index({ tenantId: 1, providerId: 1, dayOfWeek: 1 });

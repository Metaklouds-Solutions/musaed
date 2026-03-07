import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TenantStaff', default: null })
  providerId: Types.ObjectId | null;

  @Prop({ default: null })
  locationId: string | null;

  @Prop({ required: true })
  serviceType: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  timeSlot: string;

  @Prop({ default: 30 })
  durationMinutes: number;

  @Prop({ required: true, enum: ['confirmed', 'cancelled', 'completed', 'no_show'] })
  status: string;

  @Prop({ default: null })
  notes: string | null;

  @Prop({ default: false })
  reminderSent: boolean;

  @Prop({ default: null })
  reminderAt: Date | null;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ tenantId: 1, date: 1 });
BookingSchema.index({ customerId: 1 });

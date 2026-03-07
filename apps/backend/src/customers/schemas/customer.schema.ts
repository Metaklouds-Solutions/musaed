import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  email: string | null;

  @Prop({ default: null })
  phone: string | null;

  @Prop({ default: null })
  dateOfBirth: Date | null;

  @Prop({ default: 'manual', enum: ['call', 'chat', 'email', 'manual'] })
  source: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ default: 0 })
  totalBookings: number;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ tenantId: 1 });
CustomerSchema.index({ tenantId: 1, phone: 1 });
CustomerSchema.index({ tenantId: 1, email: 1 });

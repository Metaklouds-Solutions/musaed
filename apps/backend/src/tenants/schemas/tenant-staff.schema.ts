import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantStaffDocument = TenantStaff & Document;

@Schema({ timestamps: true, collection: 'tenant_staff' })
export class TenantStaff {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, enum: ['tenant_owner', 'clinic_admin', 'receptionist', 'doctor', 'auditor', 'tenant_staff'] })
  roleSlug: string;

  @Prop({ required: true, enum: ['active', 'invited', 'disabled'] })
  status: string;

  @Prop({ type: Date, default: null })
  invitedAt: Date | null;

  @Prop({ type: Date, default: null })
  joinedAt: Date | null;
}

export const TenantStaffSchema = SchemaFactory.createForClass(TenantStaff);

TenantStaffSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
TenantStaffSchema.index({ tenantId: 1 });

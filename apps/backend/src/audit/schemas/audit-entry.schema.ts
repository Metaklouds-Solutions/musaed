import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditEntryDocument = AuditEntry & Document;

@Schema({ timestamps: false })
export class AuditEntry {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
  tenantId: Types.ObjectId | null;

  @Prop({ type: Object, default: {} })
  meta: Record<string, unknown>;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const AuditEntrySchema = SchemaFactory.createForClass(AuditEntry);

AuditEntrySchema.index({ timestamp: -1 });
AuditEntrySchema.index({ tenantId: 1, timestamp: -1 });

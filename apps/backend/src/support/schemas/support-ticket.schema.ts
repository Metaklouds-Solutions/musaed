import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

@Schema({ _id: false })
export class TicketMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  body: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

@Schema({ timestamps: true, collection: 'support_tickets' })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['billing', 'technical', 'agent', 'general'] })
  category: string;

  @Prop({ required: true, enum: ['open', 'in_progress', 'resolved', 'closed'] })
  status: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'] })
  priority: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  closedAt: Date | null;

  @Prop({ type: [TicketMessage], default: [] })
  messages: TicketMessage[];
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

SupportTicketSchema.index({ tenantId: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ createdBy: 1 });

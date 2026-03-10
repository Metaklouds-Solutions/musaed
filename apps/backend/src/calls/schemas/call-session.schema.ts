import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallSessionDocument = CallSession & Document;

@Schema({ timestamps: true, collection: 'call_sessions' })
export class CallSession {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AgentInstance', required: true })
  agentInstanceId: Types.ObjectId;

  @Prop({ type: String, default: null })
  retellAgentId: string | null;

  @Prop({ type: String, required: true })
  callId: string;

  @Prop({ type: String, enum: ['started', 'ended', 'analyzed'], default: 'started' })
  status: string;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  @Prop({ type: Number, default: null })
  durationMs: number | null;

  @Prop({ type: String, default: null })
  transcript: string | null;

  @Prop({ type: String, default: null })
  recordingUrl: string | null;

  @Prop({ type: Object, default: null })
  transcriptObject: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  summary: string | null;

  @Prop({ type: String, default: null })
  sentiment: string | null;

  @Prop({
    type: String,
    enum: ['unknown', 'booked', 'escalated', 'failed', 'info_only'],
    default: 'unknown',
  })
  outcome: string;

  @Prop({ type: Types.ObjectId, ref: 'Booking', default: null })
  bookingId: Types.ObjectId | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const CallSessionSchema = SchemaFactory.createForClass(CallSession);

CallSessionSchema.index({ callId: 1 }, { unique: true });
CallSessionSchema.index({ tenantId: 1, createdAt: -1 });
CallSessionSchema.index({ tenantId: 1, outcome: 1 });
CallSessionSchema.index({ agentInstanceId: 1, createdAt: -1 });

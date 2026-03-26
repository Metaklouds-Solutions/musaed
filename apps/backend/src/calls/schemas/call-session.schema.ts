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

  @Prop({
    type: String,
    enum: ['started', 'ended', 'analyzed'],
    default: 'started',
  })
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

  @Prop({ type: Boolean, default: null })
  callSuccessful: boolean | null;

  @Prop({ type: String, default: null })
  disconnectionReason: string | null;

  @Prop({ type: Number, default: null })
  callCost: number | null;

  @Prop({ type: Number, default: null })
  latencyE2e: number | null;

  @Prop({ type: Object, default: null })
  llmTokenUsage: Record<string, unknown> | null;

  @Prop({ type: Number, default: null })
  llmTokensTotal: number | null;

  @Prop({ type: Object, default: null })
  customAnalysisData: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  callType: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Booking', default: null })
  bookingId: Types.ObjectId | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const CallSessionSchema = SchemaFactory.createForClass(CallSession);

/**
 * toJSON: List responses exclude transcript via .select() in the service.
 * Detail responses include transcript, transcriptObject, recordingUrl, summary, sentiment.
 */
CallSessionSchema.index({ callId: 1 }, { unique: true });
CallSessionSchema.index({ tenantId: 1, createdAt: -1 });
CallSessionSchema.index({ tenantId: 1, startedAt: -1 });
CallSessionSchema.index({ tenantId: 1, agentInstanceId: 1 });
CallSessionSchema.index({ tenantId: 1, outcome: 1 });
CallSessionSchema.index({ tenantId: 1, sentiment: 1 });
CallSessionSchema.index({ tenantId: 1, 'metadata.intent': 1 });
CallSessionSchema.index({ agentInstanceId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AgentRunDocument = AgentRun &
  Document & { createdAt: Date; updatedAt: Date };

@Schema({ timestamps: true, collection: 'agent_runs' })
export class AgentRun {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, index: true })
  callId: string;

  @Prop({ type: Number, default: 0 })
  cost: number;

  @Prop({ type: Number })
  tokens?: number;

  @Prop()
  agentVersion?: string;

  @Prop({ type: Date, default: () => new Date() })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt?: Date;

  @Prop({ default: 'running' })
  status: string;
}

export const AgentRunSchema = SchemaFactory.createForClass(AgentRun);

AgentRunSchema.index({ tenantId: 1, startedAt: -1 });
AgentRunSchema.index({ callId: 1, tenantId: 1 });

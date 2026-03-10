import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AgentInstanceDocument = AgentInstance & Document;

@Schema({ timestamps: true, collection: 'agent_instances' })
export class AgentInstance {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AgentTemplate', default: null })
  templateId: Types.ObjectId | null;

  @Prop({ type: String, default: '' })
  name: string;

  @Prop({ type: Number, default: 1 })
  templateVersion: number;

  @Prop({ type: [String], enum: ['voice', 'chat', 'email'], default: [] })
  channelsEnabled: string[];

  @Prop({ type: Object, default: {} })
  customConfig: Record<string, unknown>;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  assignedToStaffIds: Types.ObjectId[];

  @Prop({ required: true, enum: ['voice', 'chat', 'email'] })
  channel: string;

  @Prop({ type: String, default: null })
  retellAgentId: string | null;

  @Prop({ type: String, default: null })
  retellLlmId: string | null;

  @Prop({ type: Number, default: null })
  retellAgentVersion: number | null;

  @Prop({ type: String, default: null })
  emailAddress: string | null;

  @Prop({ required: true, enum: ['deploying', 'active', 'partially_deployed', 'paused', 'failed', 'deleted'] })
  status: string;

  @Prop({ type: Object, default: {} })
  configSnapshot: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  customPrompts: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  resolvedVariables: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  lastSyncedAt: Date | null;

  @Prop({ type: Date, default: null })
  deployedAt: Date | null;
}

export const AgentInstanceSchema = SchemaFactory.createForClass(AgentInstance);

AgentInstanceSchema.index({ tenantId: 1 });
AgentInstanceSchema.index({ status: 1 });
AgentInstanceSchema.index({ retellAgentId: 1 }, { sparse: true });

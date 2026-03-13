import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AgentChannelDeploymentDocument = AgentChannelDeployment & Document;

@Schema({ timestamps: true, collection: 'agent_channel_deployments' })
export class AgentChannelDeployment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AgentInstance', required: true })
  agentInstanceId: Types.ObjectId;

  @Prop({ required: true, enum: ['voice', 'chat', 'email'] })
  channel: string;

  @Prop({ required: true, default: 'retell' })
  provider: string;

  @Prop({
    required: true,
    enum: ['pending', 'active', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String, default: null })
  retellAgentId: string | null;

  @Prop({ type: String, default: null })
  retellConversationFlowId: string | null;

  @Prop({ type: Object, default: {} })
  flowSnapshot: Record<string, unknown>;

  @Prop({ type: String, default: null })
  error: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const AgentChannelDeploymentSchema = SchemaFactory.createForClass(
  AgentChannelDeployment,
);

AgentChannelDeploymentSchema.index({ tenantId: 1 });
AgentChannelDeploymentSchema.index({ agentInstanceId: 1 });
AgentChannelDeploymentSchema.index({ retellAgentId: 1 }, { sparse: true });
AgentChannelDeploymentSchema.index({ deletedAt: 1 }, { sparse: true });
AgentChannelDeploymentSchema.index(
  { tenantId: 1, agentInstanceId: 1, channel: 1, provider: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

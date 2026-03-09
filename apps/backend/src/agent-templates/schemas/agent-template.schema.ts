import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AgentTemplateDocument = AgentTemplate & Document;

@Schema({ timestamps: true, collection: 'agent_templates' })
export class AgentTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: ['voice', 'chat', 'email'] })
  channel: string;

  @Prop({ type: Object, default: {} })
  voiceConfig: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  chatConfig: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  emailConfig: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  llmConfig: Record<string, unknown>;

  @Prop({ default: '' })
  basePrompt: string;

  @Prop({ type: String, default: null })
  webhookUrl: string | null;

  @Prop({ type: String, default: null })
  mcpServerUrl: string | null;

  @Prop({ type: Object, default: {} })
  templateVariables: Record<string, unknown>;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 1 })
  version: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const AgentTemplateSchema = SchemaFactory.createForClass(AgentTemplate);

AgentTemplateSchema.index({ channel: 1 });
AgentTemplateSchema.index({ isDefault: 1 });
AgentTemplateSchema.index({ name: 1 });

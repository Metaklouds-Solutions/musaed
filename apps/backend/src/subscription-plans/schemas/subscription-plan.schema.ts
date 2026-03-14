import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true, collection: 'subscription_plans' })
export class SubscriptionPlan {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  stripeProductId: string | null;

  @Prop({ type: String, default: null })
  stripePriceId: string | null;

  @Prop({ required: true })
  monthlyPriceCents: number;

  @Prop({ required: true })
  maxVoiceAgents: number;

  @Prop({ required: true })
  maxChatAgents: number;

  @Prop({ required: true })
  maxEmailAgents: number;

  @Prop({ required: true })
  maxStaff: number;

  @Prop({ type: Object, default: {} })
  features: Record<string, unknown>;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.index({ name: 1 }, { unique: true });
SubscriptionPlanSchema.index({ isActive: 1 });

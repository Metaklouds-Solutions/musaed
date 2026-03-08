import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InviteTokenDocument = InviteToken & Document;

@Schema({
  timestamps: true,
  collection: 'invite_tokens',
})
export class InviteToken {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ required: true, enum: ['invite', 'password_reset'] })
  type: string;

  @Prop({ required: true, index: true, expires: 0 })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt: Date | null;
}

export const InviteTokenSchema = SchemaFactory.createForClass(InviteToken);

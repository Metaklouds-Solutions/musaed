import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
  toObject: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: false, default: null })
  passwordHash: string | null;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['ADMIN', 'TENANT_OWNER', 'STAFF'] })
  role: string;

  @Prop({ default: 'active', enum: ['pending', 'active', 'disabled'], index: true })
  status: string;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ deletedAt: 1 }, { sparse: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_doc: any, ret: any) => {
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['ADMIN', 'TENANT_OWNER', 'STAFF'] })
  role: string;

  @Prop({ default: null })
  avatarUrl: string | null;

  @Prop({ default: null })
  lastLoginAt: Date | null;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ deletedAt: 1 }, { sparse: true });

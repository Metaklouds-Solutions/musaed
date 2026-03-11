import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MaintenanceDocument = Maintenance & Document;

@Schema({ timestamps: true, collection: 'maintenance' })
export class Maintenance {
  @Prop({ default: 'default' })
  key: string;

  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: '' })
  message: string;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);

MaintenanceSchema.index({ key: 1 }, { unique: true });

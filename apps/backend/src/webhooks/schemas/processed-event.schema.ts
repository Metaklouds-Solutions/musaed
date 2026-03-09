import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProcessedEventDocument = ProcessedEvent & Document;

@Schema({ timestamps: true, collection: 'processed_events' })
export class ProcessedEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 })
  processedAt: Date;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEvent);

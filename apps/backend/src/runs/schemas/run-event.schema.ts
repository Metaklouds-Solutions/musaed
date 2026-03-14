import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RunEventDocument = RunEvent & Document;

@Schema({ timestamps: false, collection: 'run_events' })
export class RunEvent {
  @Prop({ type: Types.ObjectId, ref: 'AgentRun', required: true, index: true })
  runId: Types.ObjectId;

  @Prop({ required: true })
  eventType: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date;
}

export const RunEventSchema = SchemaFactory.createForClass(RunEvent);

RunEventSchema.index({ runId: 1, timestamp: 1 });

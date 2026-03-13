import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportSnapshotDocument = ReportSnapshot & Document;

/** Call outcome counts for a snapshot period. */
@Schema({ _id: false })
export class OutcomeCounts {
  @Prop({ default: 0 })
  unknown: number;

  @Prop({ default: 0 })
  booked: number;

  @Prop({ default: 0 })
  escalated: number;

  @Prop({ default: 0 })
  failed: number;

  @Prop({ default: 0 })
  info_only: number;
}

/** Sentiment distribution for a snapshot period. */
@Schema({ _id: false })
export class SentimentCounts {
  @Prop({ default: 0 })
  positive: number;

  @Prop({ default: 0 })
  neutral: number;

  @Prop({ default: 0 })
  negative: number;

  @Prop({ default: 0 })
  unknown: number;
}

/** Peak hour (0-23) with call count. */
@Schema({ _id: false })
export class PeakHourBucket {
  @Prop()
  hour: number;

  @Prop()
  count: number;
}

@Schema({ timestamps: true, collection: 'report_snapshots' })
export class ReportSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  snapshotDate: Date;

  @Prop({ default: 0 })
  totalCalls: number;

  @Prop({ type: OutcomeCounts, default: () => ({}) })
  outcomes: OutcomeCounts;

  @Prop({ type: SentimentCounts, default: () => ({}) })
  sentiment: SentimentCounts;

  @Prop({ type: [PeakHourBucket], default: [] })
  peakHours: PeakHourBucket[];

  @Prop({ type: Number, default: null })
  avgDurationMs: number | null;
}

export const ReportSnapshotSchema =
  SchemaFactory.createForClass(ReportSnapshot);

ReportSnapshotSchema.index({ tenantId: 1, snapshotDate: -1 }, { unique: true });
ReportSnapshotSchema.index({ snapshotDate: -1 });

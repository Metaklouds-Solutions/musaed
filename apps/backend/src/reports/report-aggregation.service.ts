import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ReportSnapshot,
  ReportSnapshotDocument,
} from './schemas/report-snapshot.schema';
import {
  CallSession,
  CallSessionDocument,
} from '../calls/schemas/call-session.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

@Injectable()
export class ReportAggregationService {
  private readonly logger = new Logger(ReportAggregationService.name);

  constructor(
    private config: ConfigService,
    @InjectModel(ReportSnapshot.name)
    private reportSnapshotModel: Model<ReportSnapshotDocument>,
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
  ) {}

  /** Runs daily at 2 AM to aggregate previous day's call data. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async aggregateDaily(): Promise<void> {
    const enabled =
      this.config.get<string>('REPORT_AGGREGATION_ENABLED', 'false') === 'true';
    if (!enabled) {
      this.logger.debug('Report aggregation disabled');
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(
      `Aggregating report snapshots for ${yesterday.toISOString().slice(0, 10)}`,
    );

    const tenants = await this.tenantModel
      .find({ deletedAt: null })
      .select('_id')
      .limit(10000)
      .lean();

    for (const t of tenants) {
      const tenantId = (t as { _id: Types.ObjectId })._id;
      try {
        await this.aggregateForTenant(tenantId, yesterday, endOfDay);
      } catch (err) {
        this.logger.error(
          `Failed to aggregate for tenant ${tenantId}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }
  }

  private async aggregateForTenant(
    tenantId: Types.ObjectId,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<void> {
    const sessions = await this.callSessionModel
      .find({
        tenantId,
        createdAt: { $gte: dateStart, $lte: dateEnd },
        status: 'analyzed',
      })
      .select('outcome sentiment durationMs createdAt')
      .limit(50000)
      .lean();

    const outcomes = {
      unknown: 0,
      booked: 0,
      escalated: 0,
      failed: 0,
      info_only: 0,
    };
    const sentiment = {
      positive: 0,
      neutral: 0,
      negative: 0,
      unknown: 0,
    };
    const hourCounts = new Map<number, number>();

    let totalDuration = 0;
    let durationCount = 0;

    for (const s of sessions) {
      const row = s as {
        outcome?: string;
        sentiment?: string;
        durationMs?: number | null;
        createdAt?: Date;
      };
      const outcome = (row.outcome ?? 'unknown') as keyof typeof outcomes;
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;

      const sent = (row.sentiment ?? 'unknown').toLowerCase();
      if (sent.includes('positive')) sentiment.positive++;
      else if (sent.includes('neutral')) sentiment.neutral++;
      else if (sent.includes('negative')) sentiment.negative++;
      else sentiment.unknown++;

      if (typeof row.durationMs === 'number') {
        totalDuration += row.durationMs;
        durationCount++;
      }

      const createdAt = row.createdAt;
      if (createdAt) {
        const hour = new Date(createdAt).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
    }

    const peakHours = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    await this.reportSnapshotModel.updateOne(
      { tenantId, snapshotDate: dateStart },
      {
        $set: {
          totalCalls: sessions.length,
          outcomes,
          sentiment,
          peakHours,
          avgDurationMs:
            durationCount > 0 ? totalDuration / durationCount : null,
        },
      },
      { upsert: true },
    );
  }
}

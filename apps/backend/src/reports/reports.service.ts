import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  CallSession,
  CallSessionDocument,
} from '../calls/schemas/call-session.schema';

export interface ABTestOutcomeRowDto {
  version: string;
  totalCalls: number;
  booked: number;
  escalated: number;
  failed: number;
  conversionRate: number;
  escalationRate: number;
  avgDurationSec: number;
  sentimentAvg: number;
}

export interface SentimentBucketDto {
  label: string;
  range: string;
  count: number;
  percentage: number;
}

export interface PeakHourPointDto {
  hour: number;
  label: string;
  count: number;
}

export interface IntentBucketDto {
  label: string;
  count: number;
  percentage: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
  ) {}

  async getPerformance(tenantId: string, dateFrom?: string, dateTo?: string) {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = { tenantId: tid };

      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
        if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
        match.date = dateFilter;
      }

      const pipeline: PipelineStage[] = [
        { $match: match },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            byStatus: { $push: '$status' },
            byServiceType: { $push: '$serviceType' },
          },
        },
      ];

      const [result] = await this.bookingModel.aggregate(pipeline);

      const statusCounts: Record<string, number> = {};
      const serviceTypeCounts: Record<string, number> = {};

      if (result) {
        for (const s of result.byStatus) {
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        }
        for (const s of result.byServiceType) {
          if (s) serviceTypeCounts[s] = (serviceTypeCounts[s] || 0) + 1;
        }
      }

      const totalCustomers = await this.customerModel.countDocuments({
        tenantId: tid,
        deletedAt: null,
      });
      const callMatch: Record<string, unknown> = { tenantId: tid };
      if (dateFrom || dateTo) {
        const createdAtFilter: Record<string, Date> = {};
        if (dateFrom) createdAtFilter.$gte = this.parseDateStart(dateFrom);
        if (dateTo) createdAtFilter.$lte = this.parseDateEnd(dateTo);
        callMatch.createdAt = createdAtFilter;
      }
      const [totalCalls, callOutcomeRows, avgCallDuration] = await Promise.all([
        this.callSessionModel.countDocuments(callMatch),
        this.callSessionModel.aggregate<{ _id: string; count: number }>([
          { $match: callMatch },
          { $group: { _id: '$outcome', count: { $sum: 1 } } },
        ]),
        this.callSessionModel.aggregate<{ value: number }>([
          { $match: { ...callMatch, durationMs: { $ne: null } } },
          { $group: { _id: null, value: { $avg: '$durationMs' } } },
        ]),
      ]);
      const callOutcomes: Record<string, number> = {
        unknown: 0,
        booked: 0,
        escalated: 0,
        failed: 0,
        info_only: 0,
      };
      for (const row of callOutcomeRows) {
        callOutcomes[row._id] = row.count;
      }

      return {
        totalBookings: result?.totalBookings ?? 0,
        byStatus: statusCounts,
        byServiceType: serviceTypeCounts,
        totalCustomers,
        callMetrics: {
          totalCalls,
          outcomes: callOutcomes,
          avgDurationMs: avgCallDuration[0]?.value ?? 0,
        },
      };
    } catch (error) {
      this.logger.error('getPerformance aggregation failed', error);
      throw new InternalServerErrorException(
        'Failed to generate performance report',
      );
    }
  }

  async getOutcomesByDay(tenantId: string, dateFrom?: string, dateTo?: string) {
    const tid = new Types.ObjectId(tenantId);
    const match: Record<string, unknown> = {
      tenantId: tid,
      status: { $nin: ['cancelled'] },
    };

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
      if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
      match.date = dateFilter;
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          byStatus: { $push: '$status' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await this.bookingModel.aggregate<{
      _id: string;
      byStatus: string[];
    }>(pipeline);
    const callMatch: Record<string, unknown> = { tenantId: tid };
    if (dateFrom || dateTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (dateFrom) createdAtFilter.$gte = this.parseDateStart(dateFrom);
      if (dateTo) createdAtFilter.$lte = this.parseDateEnd(dateTo);
      callMatch.createdAt = createdAtFilter;
    }
    const callRows = await this.callSessionModel.aggregate<{
      _id: string;
      booked: number;
      escalated: number;
      failed: number;
      total: number;
    }>([
      { $match: callMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          booked: {
            $sum: { $cond: [{ $eq: ['$outcome', 'booked'] }, 1, 0] },
          },
          escalated: {
            $sum: { $cond: [{ $eq: ['$outcome', 'escalated'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$outcome', 'failed'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const callsByDay = new Map(
      callRows.map((row) => [
        row._id,
        {
          booked: row.booked,
          escalated: row.escalated,
          failed: row.failed,
          total: row.total,
        },
      ]),
    );

    return results.map((r) => {
      const booked = r.byStatus.filter(
        (s) => s === 'completed' || s === 'confirmed',
      ).length;
      const failed = r.byStatus.filter((s) => s === 'no_show').length;
      const escalated = r.byStatus.filter((s) => s === 'escalated').length;
      const total = r.byStatus.length;
      const callMetrics = callsByDay.get(r._id) ?? {
        booked: 0,
        escalated: 0,
        failed: 0,
        total: 0,
      };
      return {
        date: r._id,
        booked,
        escalated,
        failed,
        total,
        calls: callMetrics,
      };
    });
  }

  async getTenantComparison(
    tenantIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ) {
    const match: Record<string, unknown> = {
      tenantId: { $in: tenantIds.map((id) => new Types.ObjectId(id)) },
    };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
      if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
      match.date = dateFilter;
    }

    const tenants = await this.tenantModel
      .find({
        _id: { $in: tenantIds.map((id) => new Types.ObjectId(id)) },
        deletedAt: null,
      })
      .select('name')
      .lean();

    const tenantMap = new Map(
      tenants.map((t) => [
        String((t as { _id?: unknown })._id),
        (t as { name?: string }).name ?? 'Unknown',
      ]),
    );

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: '$tenantId',
          totalBookings: { $sum: 1 },
          byStatus: { $push: '$status' },
        },
      },
    ];

    const results = await this.bookingModel.aggregate<{
      _id: Types.ObjectId;
      totalBookings: number;
      byStatus: string[];
    }>(pipeline);
    const callAgg = await this.callSessionModel.aggregate<{
      _id: Types.ObjectId;
      totalCalls: number;
      bookedCalls: number;
      escalatedCalls: number;
      failedCalls: number;
    }>([
      {
        $match: {
          tenantId: { $in: tenantIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: '$tenantId',
          totalCalls: { $sum: 1 },
          bookedCalls: {
            $sum: { $cond: [{ $eq: ['$outcome', 'booked'] }, 1, 0] },
          },
          escalatedCalls: {
            $sum: { $cond: [{ $eq: ['$outcome', 'escalated'] }, 1, 0] },
          },
          failedCalls: {
            $sum: { $cond: [{ $eq: ['$outcome', 'failed'] }, 1, 0] },
          },
        },
      },
    ]);

    const customerCounts = await Promise.all(
      tenantIds.map((tid) =>
        this.customerModel.countDocuments({
          tenantId: new Types.ObjectId(tid),
          deletedAt: null,
        }),
      ),
    );

    const rows = tenantIds.map((tid, i) => {
      const agg = results.find((r) => r._id.toString() === tid);
      const totalBookings = agg?.totalBookings ?? 0;
      const completed =
        agg?.byStatus.filter((s) => s === 'completed' || s === 'confirmed')
          .length ?? 0;
      const callMetrics = callAgg.find((row) => row._id.toString() === tid);
      const totalCalls = callMetrics?.totalCalls ?? 0;
      return {
        tenantId: tid,
        tenantName: tenantMap.get(tid) ?? 'Unknown',
        totalCalls,
        totalBookings,
        conversionRate:
          totalBookings > 0 ? (completed / totalBookings) * 100 : 0,
        escalationRate:
          totalCalls > 0
            ? ((callMetrics?.escalatedCalls ?? 0) / totalCalls) * 100
            : 0,
        avgDurationSec: 0,
        sentimentAvg: 0,
        totalCustomers: customerCounts[i] ?? 0,
        callOutcomes: {
          booked: callMetrics?.bookedCalls ?? 0,
          escalated: callMetrics?.escalatedCalls ?? 0,
          failed: callMetrics?.failedCalls ?? 0,
        },
      };
    });

    return rows;
  }

  async getOutcomesByVersion(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ABTestOutcomeRowDto[]> {
    const tid = new Types.ObjectId(tenantId);
    const match: Record<string, unknown> = { tenantId: tid };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
      if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
      match.createdAt = dateFilter;
    }
    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'agent_instances',
          localField: 'agentInstanceId',
          foreignField: '_id',
          as: 'agent',
        },
      },
      { $unwind: { path: '$agent', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$agent.templateVersion', 1] },
          totalCalls: { $sum: 1 },
          booked: { $sum: { $cond: [{ $eq: ['$outcome', 'booked'] }, 1, 0] } },
          escalated: {
            $sum: { $cond: [{ $eq: ['$outcome', 'escalated'] }, 1, 0] },
          },
          failed: { $sum: { $cond: [{ $eq: ['$outcome', 'failed'] }, 1, 0] } },
          totalDurationMs: { $sum: { $ifNull: ['$durationMs', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const rows = await this.callSessionModel.aggregate<{
      _id: number;
      totalCalls: number;
      booked: number;
      escalated: number;
      failed: number;
      totalDurationMs: number;
    }>(pipeline);
    return rows.map((r) => {
      const conversionRate =
        r.totalCalls > 0 ? (r.booked / r.totalCalls) * 100 : 0;
      const escalationRate =
        r.totalCalls > 0 ? (r.escalated / r.totalCalls) * 100 : 0;
      const avgDurationSec =
        r.totalCalls > 0 ? r.totalDurationMs / 1000 / r.totalCalls : 0;
      return {
        version: `v${r._id}`,
        totalCalls: r.totalCalls,
        booked: r.booked,
        escalated: r.escalated,
        failed: r.failed,
        conversionRate,
        escalationRate,
        avgDurationSec,
        sentimentAvg: 0,
      };
    });
  }

  async getPerformanceForPeriod(
    tenantId: string,
    period: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth',
  ) {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (period === 'thisWeek') {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(0, 0, 0, 0);
      start = monday;
      end = new Date(now);
    } else if (period === 'lastWeek') {
      const day = now.getDay();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
      lastMonday.setHours(0, 0, 0, 0);
      start = lastMonday;
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else if (period === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }
    const dateFrom = start.toISOString().slice(0, 10);
    const dateTo = end.toISOString().slice(0, 10);
    const perf = await this.getPerformance(tenantId, dateFrom, dateTo);
    const totalCalls = perf.callMetrics?.totalCalls ?? 0;
    const outcomes = perf.callMetrics?.outcomes ?? {};
    const booked = outcomes.booked ?? 0;
    const escalated = outcomes.escalated ?? 0;
    const conversionRate = totalCalls > 0 ? (booked / totalCalls) * 100 : 0;
    const escalationRate = totalCalls > 0 ? (escalated / totalCalls) * 100 : 0;
    const avgDurationMs = perf.callMetrics?.avgDurationMs ?? 0;
    return {
      totalCalls,
      // Align "Bookings" with outcome-booked for consistent KPI semantics.
      totalBookings: booked,
      avgDurationSec: avgDurationMs / 1000,
      conversionRate,
      escalationRate,
      sentimentAvg: 0,
    };
  }

  async getSentimentDistribution(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<SentimentBucketDto[]> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = {
        tenantId: tid,
        sentiment: { $nin: [null, ''] },
      };
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
        if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
        match.createdAt = dateFilter;
      }
      const rows = await this.callSessionModel.aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: { $toLower: { $ifNull: ['$sentiment', 'unknown'] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);
      const total = rows.reduce((acc, r) => acc + r.count, 0);
      const labels: Record<string, string> = {
        positive: 'Positive',
        negative: 'Negative',
        neutral: 'Neutral',
        mixed: 'Mixed',
      };
      return rows.map((r) => ({
        label: labels[r._id] ?? r._id,
        range: r._id,
        count: r.count,
        percentage: total > 0 ? (r.count / total) * 100 : 0,
      }));
    } catch (error) {
      this.logger.error('getSentimentDistribution aggregation failed', error);
      throw new InternalServerErrorException(
        'Failed to generate sentiment distribution',
      );
    }
  }

  async getPeakHours(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<PeakHourPointDto[]> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = { tenantId: tid };
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
        if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
        match.createdAt = dateFilter;
      }
      const rows = await this.callSessionModel.aggregate<{
        _id: number;
        count: number;
      }>([
        { $match: match },
        { $project: { hour: { $hour: '$createdAt' } } },
        { $group: { _id: '$hour', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      const byHour = new Map(rows.map((r) => [r._id, r.count]));
      return Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        label: `${h}:00`,
        count: byHour.get(h) ?? 0,
      }));
    } catch (error) {
      this.logger.error('getPeakHours aggregation failed', error);
      throw new InternalServerErrorException(
        'Failed to generate peak hours report',
      );
    }
  }

  async getIntentDistribution(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<IntentBucketDto[]> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = {
        tenantId: tid,
        'metadata.intent': { $exists: true, $nin: [null, ''] },
      };
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
        if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
        match.createdAt = dateFilter;
      }
      const rows = await this.callSessionModel.aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: { $toString: '$metadata.intent' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);
      const total = rows.reduce((acc, r) => acc + r.count, 0);
      return rows.map((r) => ({
        label: r._id,
        count: r.count,
        percentage: total > 0 ? (r.count / total) * 100 : 0,
      }));
    } catch (error) {
      this.logger.error('getIntentDistribution aggregation failed', error);
      throw new InternalServerErrorException(
        'Failed to generate intent distribution',
      );
    }
  }

  private parseDateStart(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return parsed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      parsed.setHours(0, 0, 0, 0);
    }
    return parsed;
  }

  private parseDateEnd(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return parsed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      parsed.setHours(23, 59, 59, 999);
    }
    return parsed;
  }
}

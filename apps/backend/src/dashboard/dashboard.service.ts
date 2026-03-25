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
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../support/schemas/support-ticket.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import {
  CallSession,
  CallSessionDocument,
} from '../calls/schemas/call-session.schema';

export interface FunnelStageDto {
  stage: string;
  count: number;
}

export interface TrendPointDto {
  date: string;
  bookings: number;
}

export interface RoiMetricsDto {
  revenue: number;
  aiCost: number;
  costSaved: number;
  roiPercent: number;
  totalMinutes: number;
}

export interface TenantAgentStatusDto {
  voice: string;
  language: string;
  status: 'active' | 'paused';
  lastSyncedAt: string;
}

export interface TenantRecentCallDto {
  id: string;
  outcome: 'booked' | 'escalated' | 'failed';
  duration: number;
  createdAt: string;
}

export interface TenantDashboardSummaryDto {
  kpis: {
    callsToday: number;
    calls7d: number;
    appointmentsBooked: number;
    escalations: number;
    missedNoAnswer: number;
    failedCalls: number;
    avgDurationSec: number;
    topOutcome: string;
    minutesUsed: number;
    creditBalance: number;
  };
  metrics: {
    totalBookings: number;
    conversionRate: number;
    callsHandled: number;
    escalationRate: number;
    costSaved: number;
    aiConfidenceScore: number;
  };
  signal: {
    status: 'healthy' | 'warning' | 'empty';
    reason: string;
  };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(AgentInstance.name)
    private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(TenantStaff.name)
    private staffModel: Model<TenantStaffDocument>,
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
  ) {}

  async getTenantMetrics(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);

    const [
      totalCustomers,
      totalBookings,
      activeAgents,
      openTicketsCount,
      totalCalls,
      bookedCallsCount,
      failedCallsCount,
      escalatedCallsCount,
      avgCallDuration,
      recentBookings,
      openTicketsList,
      staffByRole,
    ] = await Promise.all([
      this.customerModel.countDocuments({ tenantId: tid, deletedAt: null }),
      this.bookingModel.countDocuments({ tenantId: tid }),
      this.instanceModel.countDocuments({ tenantId: tid, status: 'active' }),
      this.ticketModel.countDocuments({
        tenantId: tid,
        status: { $in: ['open', 'in_progress'] },
      }),
      this.callSessionModel.countDocuments({ tenantId: tid }),
      this.callSessionModel.countDocuments({
        tenantId: tid,
        outcome: 'booked',
      }),
      this.callSessionModel.countDocuments({
        tenantId: tid,
        outcome: 'failed',
      }),
      this.callSessionModel.countDocuments({
        tenantId: tid,
        outcome: 'escalated',
      }),
      this.callSessionModel.aggregate<{ value: number }>([
        { $match: { tenantId: tid, durationMs: { $ne: null } } },
        { $group: { _id: null, value: { $avg: '$durationMs' } } },
      ]),
      this.bookingModel
        .find({ tenantId: tid })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name')
        .lean(),
      this.ticketModel
        .find({ tenantId: tid, status: { $in: ['open', 'in_progress'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id title status priority createdAt')
        .lean(),
      this.staffModel.aggregate([
        { $match: { tenantId: tid, status: 'active' } },
        { $group: { _id: '$roleSlug', count: { $sum: 1 } } },
      ]),
    ]);

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [bookingsThisMonth, newCustomersThisMonth] = await Promise.all([
      this.bookingModel.countDocuments({
        tenantId: tid,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      this.customerModel.countDocuments({
        tenantId: tid,
        deletedAt: null,
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    const roleCounts: Record<string, number> = {};
    for (const r of staffByRole) {
      const item = r as { _id: string; count: number };
      roleCounts[item._id] = item.count;
    }
    const staffCounts = {
      doctors: roleCounts['doctor'] ?? 0,
      receptionists: roleCounts['receptionist'] ?? 0,
      total: Object.values(roleCounts).reduce((acc, n) => acc + n, 0),
    };

    const openTickets = (
      openTicketsList as {
        _id?: unknown;
        title?: string;
        status?: string;
        priority?: string;
        createdAt?: Date;
      }[]
    ).map((t) => ({
      id: t._id != null ? String(t._id) : '',
      title: t.title ?? '',
      status: t.status ?? '',
      priority: t.priority ?? 'medium',
      createdAt: t.createdAt,
    }));

    return {
      totalCustomers,
      totalBookings,
      activeAgents,
      openTickets: openTicketsCount,
      openTicketsList: openTickets,
      staffCounts,
      bookingsThisMonth,
      newCustomersThisMonth,
      recentBookings,
      totalCalls,
      callOutcomes: {
        booked: bookedCallsCount,
        failed: failedCallsCount,
        escalated: escalatedCallsCount,
        unknown: Math.max(
          totalCalls -
            bookedCallsCount -
            failedCallsCount -
            escalatedCallsCount,
          0,
        ),
      },
      avgCallDurationMs: avgCallDuration[0]?.value ?? 0,
    };
  }

  async getTenantSummary(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<TenantDashboardSummaryDto> {
    const analytics = await this.getCallsAnalyticsForRange(
      tenantId,
      dateFrom,
      dateTo,
    );
    const [callsToday, totalBookings] = await Promise.all([
      this.callSessionModel.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        startedAt: {
          $gte: this.startOfToday(),
          $lte: new Date(),
        },
      }),
      this.bookingModel.countDocuments(
        this.buildBookingRangeFilter(tenantId, dateFrom, dateTo),
      ),
    ]);

    const totalCalls = analytics.totalCalls;
    const booked = analytics.outcomes.booked;
    const escalated = analytics.outcomes.escalated;
    const failed = analytics.outcomes.failed;
    const topOutcome =
      booked >= escalated && booked >= failed
        ? 'booked'
        : escalated >= failed
          ? 'escalated'
          : failed > 0
            ? 'failed'
            : '—';
    const minutesUsed =
      totalCalls > 0 ? (analytics.avgDuration * totalCalls) / 60 : 0;
    const signal = this.buildTenantSignal({
      totalCalls,
      totalBookings,
      recentRows: analytics.totalCalls,
    });

    return {
      kpis: {
        callsToday,
        calls7d: totalCalls,
        appointmentsBooked: totalBookings,
        escalations: escalated,
        missedNoAnswer: 0,
        failedCalls: failed,
        avgDurationSec: analytics.avgDuration,
        topOutcome,
        minutesUsed,
        creditBalance: 0,
      },
      metrics: {
        totalBookings,
        conversionRate: totalCalls > 0 ? (booked / totalCalls) * 100 : 0,
        callsHandled: totalCalls,
        escalationRate: totalCalls > 0 ? (escalated / totalCalls) * 100 : 0,
        costSaved: minutesUsed * 2,
        aiConfidenceScore: 0,
      },
      signal,
    };
  }

  async getFunnel(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<FunnelStageDto[]> {
    try {
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
          $facet: {
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            byOutcome: [{ $group: { _id: '$outcome', count: { $sum: 1 } } }],
          },
        },
      ];
      const [result] = await this.callSessionModel.aggregate<{
        byStatus: { _id: string; count: number }[];
        byOutcome: { _id: string; count: number }[];
      }>(pipeline);
      const statusCounts: Record<string, number> = {};
      const outcomeCounts: Record<string, number> = {};
      for (const r of result?.byStatus ?? [])
        statusCounts[r._id ?? 'started'] = r.count;
      for (const r of result?.byOutcome ?? [])
        outcomeCounts[r._id ?? 'unknown'] = r.count;
      return [
        { stage: 'started', count: statusCounts.started ?? 0 },
        { stage: 'ended', count: statusCounts.ended ?? 0 },
        { stage: 'analyzed', count: statusCounts.analyzed ?? 0 },
        { stage: 'booked', count: outcomeCounts.booked ?? 0 },
        { stage: 'escalated', count: outcomeCounts.escalated ?? 0 },
        { stage: 'failed', count: outcomeCounts.failed ?? 0 },
      ].filter((s) => s.count > 0);
    } catch (error) {
      this.logger.error('getFunnel aggregation failed', error);
      throw new InternalServerErrorException('Failed to generate funnel data');
    }
  }

  async getTrend(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<TrendPointDto[]> {
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
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];
      const rows = await this.bookingModel.aggregate<{
        _id: string;
        count: number;
      }>(pipeline);
      return rows.map((r) => ({ date: r._id, bookings: r.count }));
    } catch (error) {
      this.logger.error('getTrend aggregation failed', error);
      throw new InternalServerErrorException('Failed to generate trend data');
    }
  }

  async getRoiMetrics(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<RoiMetricsDto> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = { tenantId: tid };
    if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
        if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
        match.createdAt = dateFilter;
      }
      const [totalMinutes, bookedCount] = await Promise.all([
        this.callSessionModel.aggregate<{ total: number }>([
          { $match: { ...match, durationMs: { $ne: null } } },
          {
            $group: {
              _id: null,
              total: { $sum: { $divide: ['$durationMs', 60_000] } },
            },
          },
        ]),
        this.callSessionModel.countDocuments({ ...match, outcome: 'booked' }),
      ]);
      const minutes = totalMinutes[0]?.total ?? 0;
      const revenue = bookedCount * 50;
      const aiCost = minutes * 0.05;
      const costSaved = minutes * 2;
      const roiPercent = aiCost > 0 ? ((revenue - aiCost) / aiCost) * 100 : 0;
      return { revenue, aiCost, costSaved, roiPercent, totalMinutes: minutes };
    } catch (error) {
      this.logger.error('getRoiMetrics aggregation failed', error);
      throw new InternalServerErrorException('Failed to generate ROI metrics');
    }
  }

  async getTenantAgentStatus(
    tenantId: string,
  ): Promise<TenantAgentStatusDto | null> {
    const agent = await this.instanceModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        channel: 'voice',
        status: { $in: ['active', 'partially_deployed', 'paused'] },
      })
      .sort({ lastSyncedAt: -1 })
      .select('status lastSyncedAt customConfig')
      .lean();
    if (!agent) return null;
    const a = agent as {
      status?: string;
      lastSyncedAt?: Date;
      customConfig?: { language?: string };
    };
    return {
      voice: 'default',
      language: (a.customConfig?.language as string) ?? 'en',
      status: a.status === 'paused' ? 'paused' : 'active',
      lastSyncedAt: a.lastSyncedAt
        ? new Date(a.lastSyncedAt).toISOString()
        : new Date().toISOString(),
    };
  }

  async getTenantRecentCalls(
    tenantId: string,
    limit = 10,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<TenantRecentCallDto[]> {
    const tid = new Types.ObjectId(tenantId);
    const match: Record<string, unknown> = {
      tenantId: tid,
      outcome: { $in: ['booked', 'escalated', 'failed'] },
    };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = this.parseDateStart(dateFrom);
      if (dateTo) dateFilter.$lte = this.parseDateEnd(dateTo);
      match.createdAt = dateFilter;
    }
    const calls = await this.callSessionModel
      .find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id outcome durationMs createdAt')
      .lean();
    return calls.map((c) => {
      const doc = c as {
        _id?: unknown;
        outcome?: string;
        durationMs?: number;
        createdAt?: Date;
      };
      const outcome = doc.outcome as 'booked' | 'escalated' | 'failed';
      return {
        id: doc._id != null ? String(doc._id) : '',
        outcome: outcome ?? 'failed',
        duration: Math.round((doc.durationMs ?? 0) / 1000),
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toISOString()
          : new Date().toISOString(),
      };
    });
  }

  private async getCallsAnalyticsForRange(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const tid = new Types.ObjectId(tenantId);
    const match: Record<string, unknown> = { tenantId: tid };
    const from = dateFrom ? this.parseDateStart(dateFrom) : this.startOfDaysAgo(6);
    const to = dateTo ? this.parseDateEnd(dateTo) : new Date();
    match.startedAt = { $gte: from, $lte: to };

    const [grouped, durationAgg] = await Promise.all([
      this.callSessionModel.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: '$outcome', count: { $sum: 1 } } },
      ]),
      this.callSessionModel.aggregate<{
        totalCalls: number;
        avgDuration: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            avgDuration: { $avg: '$durationMs' },
          },
        },
      ]),
    ]);

    const outcomes = {
      booked: 0,
      escalated: 0,
      failed: 0,
      info_only: 0,
      unknown: 0,
    };
    for (const row of grouped) {
      if (row._id in outcomes) {
        outcomes[row._id as keyof typeof outcomes] = row.count;
      } else {
        outcomes.unknown += row.count;
      }
    }

    return {
      totalCalls: durationAgg[0]?.totalCalls ?? 0,
      avgDuration: Math.round((durationAgg[0]?.avgDuration ?? 0) / 1000),
      outcomes,
    };
  }

  private buildBookingRangeFilter(
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    const from = dateFrom
      ? this.startOfDay(new Date(dateFrom))
      : this.startOfDaysAgo(6);
    const to = dateTo
      ? this.endOfDay(new Date(dateTo))
      : this.endOfDay(new Date());
    filter.date = { $gte: from, $lte: to };
    return filter;
  }

  private buildTenantSignal(args: {
    totalCalls: number;
    totalBookings: number;
    recentRows: number;
  }): { status: 'healthy' | 'warning' | 'empty'; reason: string } {
    if (args.totalCalls === 0 && args.totalBookings === 0) {
      return {
        status: 'empty',
        reason: 'No calls or bookings were recorded in the selected range.',
      };
    }

    if (args.totalCalls > 0 && args.recentRows === 0) {
      return {
        status: 'warning',
        reason:
          'Aggregate call counts exist, but recent call rows are missing.',
      };
    }

    return {
      status: 'healthy',
      reason: 'Calls and bookings are flowing into the dashboard.',
    };
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private startOfDaysAgo(daysAgo: number): Date {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - daysAgo);
    return start;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private endOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  private parseDateStart(value: string): Date {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date(value);
    return isDateOnly ? this.startOfDay(parsed) : parsed;
  }

  private parseDateEnd(value: string): Date {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date(value);
    return isDateOnly ? this.endOfDay(parsed) : parsed;
  }
}

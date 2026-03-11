import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { SupportTicket, SupportTicketDocument } from '../support/schemas/support-ticket.schema';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';
import { CallSession, CallSessionDocument } from '../calls/schemas/call-session.schema';

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

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
    @InjectModel(CallSession.name) private callSessionModel: Model<CallSessionDocument>,
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
      this.ticketModel.countDocuments({ tenantId: tid, status: { $in: ['open', 'in_progress'] } }),
      this.callSessionModel.countDocuments({ tenantId: tid }),
      this.callSessionModel.countDocuments({ tenantId: tid, outcome: 'booked' }),
      this.callSessionModel.countDocuments({ tenantId: tid, outcome: 'failed' }),
      this.callSessionModel.countDocuments({ tenantId: tid, outcome: 'escalated' }),
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

    const openTickets = (openTicketsList as { _id?: unknown; title?: string; status?: string; priority?: string; createdAt?: Date }[]).map(
      (t) => ({
        id: t._id != null ? String(t._id) : '',
        title: t.title ?? '',
        status: t.status ?? '',
        priority: t.priority ?? 'medium',
        createdAt: t.createdAt,
      }),
    );

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
          totalCalls - bookedCallsCount - failedCallsCount - escalatedCallsCount,
          0,
        ),
      },
      avgCallDurationMs: avgCallDuration[0]?.value ?? 0,
    };
  }

  async getFunnel(tenantId: string, dateFrom?: string, dateTo?: string): Promise<FunnelStageDto[]> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = { tenantId: tid };
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);
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
      for (const r of result?.byStatus ?? []) statusCounts[r._id ?? 'started'] = r.count;
      for (const r of result?.byOutcome ?? []) outcomeCounts[r._id ?? 'unknown'] = r.count;
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

  async getTrend(tenantId: string, dateFrom?: string, dateTo?: string): Promise<TrendPointDto[]> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = { tenantId: tid };
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);
        match.date = dateFilter;
      }
      const pipeline: PipelineStage[] = [
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ];
      const rows = await this.bookingModel.aggregate<{ _id: string; count: number }>(pipeline);
      return rows.map((r) => ({ date: r._id, bookings: r.count }));
    } catch (error) {
      this.logger.error('getTrend aggregation failed', error);
      throw new InternalServerErrorException('Failed to generate trend data');
    }
  }

  async getRoiMetrics(tenantId: string, dateFrom?: string, dateTo?: string): Promise<RoiMetricsDto> {
    try {
      const tid = new Types.ObjectId(tenantId);
      const match: Record<string, unknown> = { tenantId: tid };
      if (dateFrom || dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);
        match.createdAt = dateFilter;
      }
      const [totalMinutes, bookedCount] = await Promise.all([
        this.callSessionModel.aggregate<{ total: number }>([
          { $match: { ...match, durationMs: { $ne: null } } },
          { $group: { _id: null, total: { $sum: { $divide: ['$durationMs', 60_000] } } } },
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

  async getTenantAgentStatus(tenantId: string): Promise<TenantAgentStatusDto | null> {
    const agent = await this.instanceModel
      .findOne({ tenantId: new Types.ObjectId(tenantId), channel: 'voice', status: { $in: ['active', 'partially_deployed', 'paused'] } })
      .sort({ lastSyncedAt: -1 })
      .select('status lastSyncedAt customConfig')
      .lean();
    if (!agent) return null;
    const a = agent as { status?: string; lastSyncedAt?: Date; customConfig?: { language?: string } };
    return {
      voice: 'default',
      language: (a.customConfig?.language as string) ?? 'en',
      status: a.status === 'paused' ? 'paused' : 'active',
      lastSyncedAt: a.lastSyncedAt ? new Date(a.lastSyncedAt).toISOString() : new Date().toISOString(),
    };
  }

  async getTenantRecentCalls(
    tenantId: string,
    limit = 10,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<TenantRecentCallDto[]> {
    const tid = new Types.ObjectId(tenantId);
    const match: Record<string, unknown> = { tenantId: tid, outcome: { $in: ['booked', 'escalated', 'failed'] } };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      match.createdAt = dateFilter;
    }
    const calls = await this.callSessionModel
      .find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id outcome durationMs createdAt')
      .lean();
    return calls.map((c) => {
      const doc = c as { _id?: unknown; outcome?: string; durationMs?: number; createdAt?: Date };
      const outcome = doc.outcome as 'booked' | 'escalated' | 'failed';
      return {
        id: doc._id != null ? String(doc._id) : '',
        outcome: outcome ?? 'failed',
        duration: Math.round((doc.durationMs ?? 0) / 1000),
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }
}

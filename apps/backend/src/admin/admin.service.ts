import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../support/schemas/support-ticket.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { CallSession, CallSessionDocument } from '../calls/schemas/call-session.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(TenantStaff.name)
    private staffModel: Model<TenantStaffDocument>,
    @InjectModel(AgentInstance.name)
    private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
  ) {}

  async getSystemOverview() {
    const businessActiveStatuses = ['ACTIVE', 'TRIAL', 'ONBOARDING'];
    const [
      totalUsers,
      totalTenants,
      activeTenants,
      totalStaff,
      totalAgents,
      activeAgents,
      openTickets,
    ] = await Promise.all([
      this.userModel.countDocuments({ deletedAt: null }),
      this.tenantModel.countDocuments({ deletedAt: null }),
      this.tenantModel.countDocuments({
        deletedAt: null,
        status: { $in: businessActiveStatuses },
      }),
      this.staffModel.countDocuments(),
      this.instanceModel.countDocuments(),
      this.instanceModel.countDocuments({ status: 'active' }),
      this.ticketModel.countDocuments({
        status: { $in: ['open', 'in_progress'] },
      }),
    ]);

    return {
      totalUsers,
      totalTenants,
      activeTenants,
      totalStaff,
      totalAgents,
      activeAgents,
      openTickets,
    };
  }

  async getSystemHealth() {
    const mem = process.memoryUsage();
    const MB = 1024 * 1024;
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / MB),
        heapTotalMB: Math.round(mem.heapTotal / MB),
        rssMB: Math.round(mem.rss / MB),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getDashboardSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const callRangeFilter = {
      startedAt: { $gte: sevenDaysAgo, $lte: now },
    };

    const [
      overview,
      tenantRows,
      agentCounts,
      supportRows,
      recentCalls,
      analytics,
      bookings7d,
    ] = await Promise.all([
      this.getSystemOverview(),
      this.tenantModel
        .find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id name status createdAt planId ownerId')
        .populate('planId', 'name')
        .populate('ownerId', 'status lastLoginAt')
        .lean(),
      this.instanceModel.aggregate<{ _id: unknown; count: number }>([
        { $match: { status: { $ne: 'deleted' }, tenantId: { $ne: null } } },
        { $group: { _id: '$tenantId', count: { $sum: 1 } } },
      ]),
      this.ticketModel
        .find({ status: { $in: ['open', 'in_progress'] } })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('_id status priority createdAt')
        .lean(),
      this.callSessionModel
        .find({ ...callRangeFilter })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('tenantId', 'name')
        .populate('agentInstanceId', 'name')
        .select('_id tenantId agentInstanceId outcome durationMs startedAt createdAt')
        .lean(),
      this.getCallsAnalytics(sevenDaysAgo, now),
      this.bookingModel.countDocuments({
        date: { $gte: sevenDaysAgo, $lte: this.endOfDay(now) },
      }),
    ]);
    const agentCountMap = new Map(
      (agentCounts ?? []).map((row) => [String(row._id), row.count]),
    );
    const typedTenantRows = tenantRows as Array<{
      _id: unknown;
      name?: string;
      status?: string;
      createdAt?: Date | string;
      planId?: { name?: string } | null;
      ownerId?: { status?: string; lastLoginAt?: unknown } | null;
    }>;
    const typedSupportRows = supportRows as Array<{
      _id: unknown;
      status?: string;
      priority?: string;
      createdAt?: Date | string;
    }>;
    const typedRecentCalls = recentCalls as Array<{
      _id: unknown;
      tenantId?: { _id?: unknown; name?: string } | null;
      agentInstanceId?: { name?: string } | null;
      outcome?: string;
      durationMs?: number | null;
      startedAt?: Date | string | null;
      createdAt?: Date | string;
    }>;

    const callsToday = await this.callSessionModel.countDocuments({
      startedAt: { $gte: todayStart, $lte: now },
    });

    const supportSnapshot = {
      openCount: typedSupportRows.length,
      criticalCount: typedSupportRows.filter((ticket) => ticket.priority === 'critical').length,
      oldestWaitingDays: typedSupportRows.reduce((max, ticket) => {
        const createdAt = this.toDate(ticket.createdAt);
        if (Number.isNaN(createdAt.getTime())) return max;
        const age = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
        return Math.max(max, age);
      }, 0),
    };

    const totalCalls = analytics.totalCalls;
    const booked = analytics.outcomes.booked;
    const escalated = analytics.outcomes.escalated;
    const aiMinutesUsed = totalCalls > 0 ? (totalCalls * analytics.avgDuration) / 60 : 0;
    const estimatedCostUsd = totalCalls > 0 ? (totalCalls * analytics.avgDuration * 0.05) / 60 : 0;
    const webhookStatus = supportSnapshot.criticalCount > 0 ? 'degraded' : 'ok';

    return {
      signal: this.buildAdminSignal({
        totalTenants: overview.totalTenants,
        activeTenants: overview.activeTenants,
        calls7d: totalCalls,
        recentCalls: typedRecentCalls.length,
        recentTenants: typedTenantRows.length,
        openTickets: supportSnapshot.openCount,
      }),
      health: {
        retellSync: 'ok' as const,
        webhooks: webhookStatus as 'ok' | 'degraded' | 'error',
        uptimeSeconds: Math.round(process.uptime()),
      },
      kpis: {
        activeTenants: overview.activeTenants,
        activeAgents: overview.activeAgents,
        callsToday,
        calls7d: totalCalls,
        bookedPercent: totalCalls > 0 ? (booked / totalCalls) * 100 : 0,
        escalationPercent: totalCalls > 0 ? (escalated / totalCalls) * 100 : 0,
        aiMinutesUsed,
        estimatedCostUsd,
      },
      recentTenants: typedTenantRows.map((tenant) => {
        const tenantId = String(tenant._id);
        const agentCount = agentCountMap.get(tenantId) ?? 0;
        const owner = tenant.ownerId;
        const ownerStatus =
          owner && typeof owner === 'object' && 'status' in owner
            ? String(owner.status ?? '').toLowerCase()
            : null;
        const ownerLastLoginAt =
          owner && typeof owner === 'object' && owner.lastLoginAt != null;
        let dynamicStep = 1;
        if (agentCount > 0) dynamicStep = 2;
        if (dynamicStep >= 2 && ownerStatus === 'active' && ownerLastLoginAt)
          dynamicStep = 3;
        if (
          dynamicStep >= 3 &&
          (tenant.status === 'ACTIVE' || Boolean(tenant.planId))
        ) {
          dynamicStep = 4;
        }
        const onboardingProgress = Math.min(100, Math.max(0, dynamicStep * 25));
        return {
          id: tenantId,
          name: tenant.name ?? '',
          plan:
            tenant.planId && typeof tenant.planId === 'object' && 'name' in tenant.planId
              ? String(tenant.planId.name ?? '—')
              : '—',
          status:
            tenant.status === 'ACTIVE' || tenant.status === 'SUSPENDED'
              ? tenant.status
              : 'TRIAL',
          createdAt:
            tenant.createdAt instanceof Date
              ? tenant.createdAt.toISOString()
              : this.toDate(tenant.createdAt).toISOString(),
          onboardingProgress,
        };
      }),
      supportSnapshot,
      recentCalls: typedRecentCalls.map((call) => ({
        id: String(call._id),
        tenantId:
          call.tenantId && typeof call.tenantId === 'object' && '_id' in call.tenantId
            ? String(call.tenantId._id)
            : '',
        tenantName:
          call.tenantId && typeof call.tenantId === 'object' && 'name' in call.tenantId
            ? String(call.tenantId.name ?? '—')
            : '—',
        agentName:
          call.agentInstanceId &&
          typeof call.agentInstanceId === 'object' &&
          'name' in call.agentInstanceId
            ? String(call.agentInstanceId.name ?? '—')
            : '—',
        outcome:
          call.outcome === 'booked' ||
          call.outcome === 'escalated' ||
          call.outcome === 'failed'
            ? call.outcome
            : 'pending',
        duration: call.durationMs ? Math.round(call.durationMs / 1000) : 0,
        startedAt:
          call.startedAt instanceof Date
            ? call.startedAt.toISOString()
            : call.createdAt instanceof Date
              ? call.createdAt.toISOString()
              : new Date().toISOString(),
      })),
    };
  }

  private async getCallsAnalytics(from: Date, to: Date) {
    const [grouped, durationAgg] = await Promise.all([
      this.callSessionModel.aggregate<{ _id: string; count: number }>([
        { $match: { startedAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$outcome', count: { $sum: 1 } } },
      ]),
      this.callSessionModel.aggregate<{ totalCalls: number; avgDuration: number }>([
        { $match: { startedAt: { $gte: from, $lte: to } } },
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

  private buildAdminSignal(args: {
    totalTenants: number;
    activeTenants: number;
    calls7d: number;
    recentCalls: number;
    recentTenants: number;
    openTickets: number;
  }) {
    if (
      args.totalTenants === 0 &&
      args.calls7d === 0 &&
      args.recentCalls === 0 &&
      args.recentTenants === 0 &&
      args.openTickets === 0
    ) {
      return {
        status: 'empty',
        reason: 'No tenants, calls, or support activity are visible yet.',
      };
    }

    if (args.activeTenants > 0 && args.calls7d === 0 && args.recentCalls === 0) {
      return {
        status: 'warning',
        reason: 'Active tenants exist, but no recent call activity reached the admin dashboard.',
      };
    }

    return {
      status: 'healthy',
      reason: 'Tenant, call, and support activity are flowing into the admin dashboard.',
    };
  }

  private toDate(value: Date | string | undefined | null): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      return new Date(value);
    }
    return new Date(0);
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
}

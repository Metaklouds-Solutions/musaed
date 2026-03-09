import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { SupportTicket, SupportTicketDocument } from '../support/schemas/support-ticket.schema';
import { TenantStaff, TenantStaffDocument } from '../tenants/schemas/tenant-staff.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(TenantStaff.name) private staffModel: Model<TenantStaffDocument>,
  ) {}

  async getTenantMetrics(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);

    const [
      totalCustomers,
      totalBookings,
      activeAgents,
      openTicketsCount,
      recentBookings,
      openTicketsList,
      staffByRole,
    ] = await Promise.all([
      this.customerModel.countDocuments({ tenantId: tid, deletedAt: null }),
      this.bookingModel.countDocuments({ tenantId: tid }),
      this.instanceModel.countDocuments({ tenantId: tid, status: 'active' }),
      this.ticketModel.countDocuments({ tenantId: tid, status: { $in: ['open', 'in_progress'] } }),
      this.bookingModel
        .find({ tenantId: tid })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name'),
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
    };
  }
}

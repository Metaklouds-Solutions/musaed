import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { SupportTicket, SupportTicketDocument } from '../support/schemas/support-ticket.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async getTenantMetrics(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);

    const [
      totalCustomers,
      totalBookings,
      activeAgents,
      openTickets,
      recentBookings,
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

    return {
      totalCustomers,
      totalBookings,
      activeAgents,
      openTickets,
      bookingsThisMonth,
      newCustomersThisMonth,
      recentBookings,
    };
  }
}

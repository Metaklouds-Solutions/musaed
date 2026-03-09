import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async getPerformance(tenantId: string, dateFrom?: string, dateTo?: string) {
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

    return {
      totalBookings: result?.totalBookings ?? 0,
      byStatus: statusCounts,
      byServiceType: serviceTypeCounts,
      totalCustomers,
    };
  }

  async getOutcomesByDay(tenantId: string, dateFrom?: string, dateTo?: string) {
    const tid = new Types.ObjectId(tenantId);
    const match: Record<string, unknown> = { tenantId: tid, status: { $nin: ['cancelled'] } };

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      match.date = dateFilter;
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, byStatus: { $push: '$status' } } },
      { $sort: { _id: 1 } },
    ];

    const results = await this.bookingModel.aggregate<{ _id: string; byStatus: string[] }>(pipeline);

    return results.map((r) => {
      const booked = r.byStatus.filter((s) => s === 'completed' || s === 'confirmed').length;
      const failed = r.byStatus.filter((s) => s === 'no_show').length;
      const escalated = r.byStatus.filter((s) => s === 'escalated').length;
      const total = r.byStatus.length;
      return {
        date: r._id,
        booked,
        escalated,
        failed,
        total,
      };
    });
  }

  async getTenantComparison(tenantIds: string[], dateFrom?: string, dateTo?: string) {
    const match: Record<string, unknown> = { tenantId: { $in: tenantIds.map((id) => new Types.ObjectId(id)) } };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      match.date = dateFilter;
    }

    const tenants = await this.tenantModel.find({ _id: { $in: tenantIds.map((id) => new Types.ObjectId(id)) }, deletedAt: null }).select('name').lean();

    const tenantMap = new Map(tenants.map((t) => [String((t as { _id?: unknown })._id), (t as { name?: string }).name ?? 'Unknown']));

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $group: { _id: '$tenantId', totalBookings: { $sum: 1 }, byStatus: { $push: '$status' } } },
    ];

    const results = await this.bookingModel.aggregate<{ _id: Types.ObjectId; totalBookings: number; byStatus: string[] }>(pipeline);

    const customerCounts = await Promise.all(
      tenantIds.map((tid) => this.customerModel.countDocuments({ tenantId: new Types.ObjectId(tid), deletedAt: null }))
    );

    const rows = tenantIds.map((tid, i) => {
      const agg = results.find((r) => r._id.toString() === tid);
      const totalBookings = agg?.totalBookings ?? 0;
      const completed = agg?.byStatus.filter((s) => s === 'completed' || s === 'confirmed').length ?? 0;
      return {
        tenantId: tid,
        tenantName: tenantMap.get(tid) ?? 'Unknown',
        totalCalls: 0,
        totalBookings,
        conversionRate: totalBookings > 0 ? (completed / totalBookings) * 100 : 0,
        escalationRate: 0,
        avgDurationSec: 0,
        sentimentAvg: 0,
        totalCustomers: customerCounts[i] ?? 0,
      };
    });

    return rows;
  }
}

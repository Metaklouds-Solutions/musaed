import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
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
}

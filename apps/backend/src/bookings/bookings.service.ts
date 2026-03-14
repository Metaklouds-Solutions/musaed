import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../common/constants';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async findAllForTenant(
    tenantId: string,
    query: { page?: number; limit?: number; date?: string; status?: string },
  ) {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, date, status } = query;
    const filter: FilterQuery<BookingDocument> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.date = { $gte: dayStart, $lt: dayEnd };
    }
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('customerId', 'name email phone')
        .populate('providerId')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date: -1, timeSlot: 1 })
        .lean(),
      this.bookingModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async create(tenantId: string, dto: CreateBookingDto) {
    const tid = new Types.ObjectId(tenantId);

    const customer = await this.customerModel.findOne({
      _id: new Types.ObjectId(dto.customerId),
      tenantId: tid,
      deletedAt: null,
    });
    if (!customer) {
      throw new BadRequestException('Customer not found in this tenant');
    }

    if (dto.providerId) {
      const conflict = await this.bookingModel.findOne({
        tenantId: tid,
        providerId: new Types.ObjectId(dto.providerId),
        date: new Date(dto.date),
        timeSlot: dto.timeSlot,
        status: { $nin: ['cancelled'] },
      });
      if (conflict) {
        throw new ConflictException(
          'This provider already has a booking at the selected date and time slot',
        );
      }
    }

    const booking = await this.bookingModel.create({
      ...dto,
      tenantId: tid,
      customerId: customer._id,
      providerId: dto.providerId ? new Types.ObjectId(dto.providerId) : null,
      date: new Date(dto.date),
      status: dto.status ?? 'confirmed',
    });

    await this.customerModel.updateOne(
      { _id: booking.customerId, tenantId: tid },
      { $inc: { totalBookings: 1 } },
    );

    const customerName = customer.name ?? 'Customer';
    await this.notificationsService.createForTenantStaff(tenantId, {
      type: 'booking_new',
      title: 'New booking',
      message: `${customerName} - ${dto.date} ${dto.timeSlot ?? ''}`,
      link: `/bookings`,
      meta: {
        bookingId: booking._id.toString(),
        customerId: customer._id.toString(),
      },
      priority: 'normal',
    });

    return booking;
  }

  async update(id: string, tenantId: string, dto: UpdateBookingDto) {
    const oldBooking = await this.bookingModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!oldBooking) throw new NotFoundException('Booking not found');

    const wasCancelled = oldBooking.status === 'cancelled';
    const isCancelling = dto.status === 'cancelled';

    const booking = await this.bookingModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { $set: dto },
      { new: true },
    );

    if (!wasCancelled && isCancelling) {
      await this.customerModel.updateOne(
        { _id: oldBooking.customerId, tenantId: new Types.ObjectId(tenantId) },
        { $inc: { totalBookings: -1 } },
      );
    }

    return booking;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async findAllForTenant(
    tenantId: string,
    query: { page?: number; limit?: number; date?: string; status?: string },
  ) {
    const { page = 1, limit = 20, date, status } = query;
    const filter: any = { tenantId: new Types.ObjectId(tenantId) };

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
        .sort({ date: -1, timeSlot: 1 }),
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

    const booking = await this.bookingModel.create({
      ...dto,
      tenantId: tid,
      customerId: customer._id,
      providerId: dto.providerId ? new Types.ObjectId(dto.providerId) : null,
      date: new Date(dto.date),
      status: dto.status ?? 'confirmed',
    });

    await this.customerModel.updateOne(
      { _id: booking.customerId },
      { $inc: { totalBookings: 1 } },
    );

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
        { _id: oldBooking.customerId },
        { $inc: { totalBookings: -1 } },
      );
    }

    return booking;
  }
}

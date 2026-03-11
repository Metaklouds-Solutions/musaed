import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async findAllForTenant(
    tenantId: string,
    query: { page?: number; limit?: number; search?: string },
  ) {
    const { page = 1, limit = 20, search } = query;
    const filter: FilterQuery<CustomerDocument> = {
      tenantId: new Types.ObjectId(tenantId),
      deletedAt: null,
    };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.customerModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, tenantId: string) {
    const customer = await this.customerModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
      deletedAt: null,
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const bookings = await this.bookingModel
      .find({ customerId: customer._id, tenantId: new Types.ObjectId(tenantId) })
      .sort({ date: -1 })
      .limit(10);

    return { customer, recentBookings: bookings };
  }

  async create(tenantId: string, dto: CreateCustomerDto) {
    return this.customerModel.create({
      ...dto,
      tenantId: new Types.ObjectId(tenantId),
    });
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    const customer = await this.customerModel.findOneAndUpdate(
      {
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
        deletedAt: null,
      },
      { $set: dto },
      { new: true },
    );
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async exportData(id: string, tenantId: string) {
    const customer = await this.customerModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
      deletedAt: null,
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const bookings = await this.bookingModel.find({
      customerId: customer._id,
      tenantId: new Types.ObjectId(tenantId),
    });

    return {
      customer: customer.toObject(),
      bookings: bookings.map((b) => b.toObject()),
      exportedAt: new Date().toISOString(),
    };
  }

  async softDelete(id: string, tenantId: string) {
    const customer = await this.customerModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!customer) throw new NotFoundException('Customer not found');
    return { message: 'Customer deleted' };
  }
}

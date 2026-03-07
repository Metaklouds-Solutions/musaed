import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupportTicket, SupportTicketDocument } from './schemas/support-ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
  ) {}

  async findAllForTenant(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string } = {},
  ) {
    const { page = 1, limit = 20, status } = query;
    const filter: any = { tenantId: new Types.ObjectId(tenantId) };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.ticketModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findAllAdmin(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.ticketModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, tenantId?: string) {
    const filter: any = { _id: id };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const ticket = await this.ticketModel
      .findOne(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('messages.authorId', 'name email');

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(tenantId: string, userId: string, dto: CreateTicketDto) {
    const ticket = await this.ticketModel.create({
      tenantId: new Types.ObjectId(tenantId),
      createdBy: new Types.ObjectId(userId),
      title: dto.title,
      category: dto.category,
      priority: dto.priority ?? 'medium',
      status: 'open',
      messages: dto.body
        ? [{ authorId: new Types.ObjectId(userId), body: dto.body, createdAt: new Date() }]
        : [],
    });

    return ticket;
  }

  async addMessage(id: string, tenantId: string, userId: string, dto: AddMessageDto) {
    const ticket = await this.ticketModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      {
        $push: {
          messages: {
            authorId: new Types.ObjectId(userId),
            body: dto.body,
            createdAt: new Date(),
          },
        },
        $set: { status: 'in_progress' },
      },
      { new: true },
    );
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}

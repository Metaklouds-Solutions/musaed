import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { SupportTicket, SupportTicketDocument } from './schemas/support-ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async findAllForTenant(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string } = {},
  ) {
    const { page = 1, limit = 20, status } = query;
    const filter: FilterQuery<SupportTicketDocument> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findAllAdmin(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const filter: FilterQuery<SupportTicketDocument> = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, tenantId?: string) {
    const filter: FilterQuery<SupportTicketDocument> = { _id: id };
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

    await this.notificationsService.createForTenantStaff(tenantId, {
      type: 'ticket_new',
      source: 'tenant',
      severity: 'normal',
      title: 'New support ticket',
      message: dto.title,
      link: `/help/tickets/${ticket._id}`,
      meta: { ticketId: ticket._id.toString() },
      priority: dto.priority === 'high' || dto.priority === 'critical' ? 'high' : 'normal',
    });

    await this.notificationsService.createForAdmins({
      type: 'tenant_ticket_submitted',
      source: 'tenant',
      severity: dto.priority === 'critical' ? 'critical' : 'important',
      title: 'Tenant submitted a support ticket',
      message: dto.title,
      link: `/admin/support/${ticket._id}`,
      metadata: {
        ticketId: ticket._id.toString(),
        tenantId,
        priority: dto.priority ?? 'medium',
        category: dto.category,
      },
      priority: dto.priority === 'critical' ? 'critical' : 'high',
    });

    return ticket;
  }

  /**
   * Updates the status of a support ticket, scoped by optional tenantId.
   */
  async updateStatus(id: string, status: string, tenantId?: string) {
    const filter: FilterQuery<SupportTicketDocument> = { _id: id };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const update: Record<string, unknown> = { status };
    if (status === 'closed' || status === 'resolved') {
      update.closedAt = new Date();
    }

    const ticket = await this.ticketModel.findOneAndUpdate(filter, { $set: update }, { new: true });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async addMessage(id: string, userId: string, dto: AddMessageDto, tenantId?: string) {
    const filter: FilterQuery<SupportTicketDocument> = { _id: id };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const ticket = await this.ticketModel.findOne(filter);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const update: Record<string, unknown> = {
      $push: {
        messages: {
          authorId: new Types.ObjectId(userId),
          body: dto.body,
          createdAt: new Date(),
        },
      },
    };

    const closedStatuses = ['resolved', 'closed'];
    if (!closedStatuses.includes(ticket.status)) {
      (update as Record<string, Record<string, string>>).$set = { status: 'in_progress' };
    }

    const updated = await this.ticketModel.findOneAndUpdate(filter, update, { new: true });
    const tid = tenantId ?? (ticket.tenantId ? String(ticket.tenantId) : undefined);
    if (updated && tid) {
      await this.notificationsService.createForTenantStaff(tid, {
        type: 'ticket_updated',
        source: 'tenant',
        severity: 'info',
        title: 'Ticket updated',
        message: `New reply on: ${ticket.title}`,
        link: `/help/tickets/${ticket._id}`,
        meta: { ticketId: ticket._id.toString() },
        priority: 'normal',
      });
    }
    return updated;
  }
}

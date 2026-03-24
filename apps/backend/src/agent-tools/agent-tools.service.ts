import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { safeEqual } from '../common/helpers/timing-safe-equal';
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  AgentTemplate,
  AgentTemplateDocument,
} from '../agent-templates/schemas/agent-template.schema';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../support/schemas/support-ticket.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  CallSession,
  CallSessionDocument,
} from '../calls/schemas/call-session.schema';

interface AgentContext {
  agent: AgentInstanceDocument & { tenantId: Types.ObjectId };
  tenant: TenantDocument;
  template: AgentTemplateDocument | null;
}

@Injectable()
export class AgentToolsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(AgentInstance.name)
    private readonly agentModel: Model<AgentInstanceDocument>,
    @InjectModel(AgentTemplate.name)
    private readonly templateModel: Model<AgentTemplateDocument>,
    @InjectModel(SupportTicket.name)
    private readonly ticketModel: Model<SupportTicketDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(CallSession.name)
    private readonly callSessionModel: Model<CallSessionDocument>,
  ) {}

  validateToolApiKey(rawApiKey?: string): void {
    const configured = this.configService.get<string>('RETELL_TOOL_API_KEY');
    if (!configured || configured.trim().length === 0) {
      throw new UnauthorizedException('Tool API key is not configured');
    }
    if (!safeEqual(rawApiKey, configured)) {
      throw new UnauthorizedException('Invalid tool API key');
    }
  }

  async getAgentConfig(agentId: string) {
    const context = await this.getAgentContext(agentId);
    const capabilityLevel =
      this.readCapabilityLevel(context.agent.customConfig) ??
      context.template?.capabilityLevel ??
      'L1';
    return {
      result: {
        capability_level: capabilityLevel,
        channels_enabled: context.agent.channelsEnabled,
        tenant_id: context.agent.tenantId.toString(),
      },
    };
  }

  async getPastTickets(
    agentId: string,
    userEmail: string,
    minutesThreshold = 1440,
  ) {
    const context = await this.getAgentContext(agentId);
    const user = await this.userModel.findOne({
      email: userEmail.toLowerCase().trim(),
      deletedAt: null,
    });
    if (!user) {
      return { result: { tickets: [] } };
    }

    const thresholdDate = new Date(
      Date.now() - Math.max(minutesThreshold, 1) * 60_000,
    );
    const tickets = await this.ticketModel
      .find({
        tenantId: context.agent.tenantId,
        createdBy: user._id,
        createdAt: { $gte: thresholdDate },
      })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      result: {
        tickets: tickets.map((ticket) => ({
          id: ticket._id.toString(),
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.get('createdAt') as Date | undefined,
        })),
      },
    };
  }

  async createTicket(
    agentId: string,
    userEmail: string,
    subject: string,
    problem: string,
  ) {
    const context = await this.getAgentContext(agentId);
    const requester = await this.findOrCreateRequester(
      context.agent.tenantId.toString(),
      userEmail,
    );

    const ticket = await this.ticketModel.create({
      tenantId: context.agent.tenantId,
      title: subject,
      category: 'agent',
      status: 'open',
      priority: 'medium',
      createdBy: requester._id,
      messages: [
        {
          authorId: requester._id,
          body: problem,
          createdAt: new Date(),
        },
      ],
    });

    return {
      result: {
        ticket_id: ticket._id.toString(),
        status: ticket.status,
      },
    };
  }

  async getAvailableSkills(agentId: string) {
    const context = await this.getAgentContext(agentId);
    const skills = this.readSkills(context.agent.customConfig);
    return {
      result: {
        skills,
      },
    };
  }

  async invokeSkill(
    agentId: string,
    skillName: string,
    params: Record<string, unknown>,
  ) {
    await this.getAgentContext(agentId);
    return {
      result: {
        skill: skillName,
        status: 'accepted',
        params,
      },
    };
  }

  async createLead(agentId: string, payload: Record<string, unknown>) {
    await this.getAgentContext(agentId);
    return {
      result: {
        lead_id: `lead_${Date.now()}`,
        status: 'accepted',
        payload,
      },
    };
  }

  async getAvailableSlots(
    agentId: string,
    preferredDate: string,
    preferredTimeWindow: string,
    timezone: string,
  ) {
    const context = await this.getAgentContext(agentId);
    const date = this.parseDate(preferredDate);
    const candidateSlots = this.buildCandidateSlots(date, preferredTimeWindow);
    const existing = await this.bookingModel.find({
      tenantId: context.agent.tenantId,
      date: {
        $gte: this.getStartOfDay(date),
        $lt: this.getEndOfDay(date),
      },
      status: { $nin: ['cancelled'] },
    });
    const booked = new Set(existing.map((item) => item.timeSlot));
    const availableSlots = candidateSlots
      .filter((slot) => !booked.has(slot))
      .slice(0, 5);
    return {
      result: {
        timezone,
        available_slots: availableSlots,
      },
    };
  }

  async bookMeeting(
    agentId: string,
    email: string,
    confirmedSlot: string,
    timezone: string,
    extras: Record<string, unknown>,
  ) {
    const context = await this.getAgentContext(agentId);
    const customer = await this.findOrCreateCustomer(
      context.agent.tenantId.toString(),
      email,
      this.readString(extras.firstName) ?? 'Guest',
      this.readString(extras.lastName) ?? '',
    );
    const { date, timeSlot } = this.parseConfirmedSlot(confirmedSlot);
    await this.assertSlotAvailable(context.agent.tenantId, date, timeSlot);
    const booking = await this.bookingModel.create({
      tenantId: context.agent.tenantId,
      customerId: customer._id,
      providerId: null,
      locationId: null,
      serviceType: this.readString(extras.meeting_type) ?? 'Consultation',
      date,
      timeSlot,
      durationMinutes: 30,
      status: 'confirmed',
      notes: `Booked via Retell tool (${timezone})`,
      reminderSent: false,
      reminderAt: null,
    });
    await this.customerModel.updateOne(
      { _id: customer._id },
      { $inc: { totalBookings: 1 } },
    );
    const callId = this.readString(extras.call_id);
    if (callId) {
      await this.callSessionModel.updateOne(
        {
          tenantId: context.agent.tenantId,
          callId,
        },
        {
          $set: {
            bookingId: booking._id,
            outcome: 'booked',
          },
        },
      );
    }
    return {
      result: {
        meeting_id: booking._id.toString(),
        status: 'confirmed',
      },
    };
  }

  async resendInvite(agentId: string, email: string, meetingId?: string) {
    await this.getAgentContext(agentId);
    return {
      result: {
        status: 'queued',
        email,
        meeting_id: meetingId ?? null,
      },
    };
  }

  async cancelBooking(
    agentId: string,
    email: string,
    meetingId?: string,
  ): Promise<{ result: { meeting_id: string; status: string } }> {
    const context = await this.getAgentContext(agentId);
    const tid = context.agent.tenantId;
    const normalizedEmail = email.toLowerCase().trim();

    let booking: BookingDocument | null = null;
    if (meetingId && Types.ObjectId.isValid(meetingId)) {
      booking = await this.bookingModel.findOne({
        _id: new Types.ObjectId(meetingId),
        tenantId: tid,
        status: { $nin: ['cancelled'] },
      });
    }
    if (!booking) {
      const customer = await this.customerModel.findOne({
        tenantId: tid,
        email: normalizedEmail,
        deletedAt: null,
      });
      if (!customer) {
        throw new NotFoundException('No booking found for this email');
      }
      booking = await this.bookingModel
        .findOne({
          tenantId: tid,
          customerId: customer._id,
          status: { $nin: ['cancelled'] },
        })
        .sort({ date: -1, timeSlot: -1 })
        .limit(1)
        .exec();
    }
    if (!booking) {
      throw new NotFoundException('No booking found to cancel');
    }

    await this.bookingModel.updateOne(
      { _id: booking._id, tenantId: tid },
      { $set: { status: 'cancelled' } },
    );
    await this.customerModel.updateOne(
      { _id: booking.customerId, tenantId: tid },
      { $inc: { totalBookings: -1 } },
    );

    return {
      result: {
        meeting_id: booking._id.toString(),
        status: 'cancelled',
      },
    };
  }

  async rescheduleBooking(
    agentId: string,
    email: string,
    newSlot: string,
    timezone: string,
    meetingId?: string,
  ): Promise<{
    result: { old_meeting_id: string; new_meeting_id: string; status: string };
  }> {
    const context = await this.getAgentContext(agentId);
    const tid = context.agent.tenantId;
    const normalizedEmail = email.toLowerCase().trim();

    let oldBooking: BookingDocument | null = null;
    if (meetingId && Types.ObjectId.isValid(meetingId)) {
      oldBooking = await this.bookingModel.findOne({
        _id: new Types.ObjectId(meetingId),
        tenantId: tid,
        status: { $nin: ['cancelled'] },
      });
    }
    if (!oldBooking) {
      const customer = await this.customerModel.findOne({
        tenantId: tid,
        email: normalizedEmail,
        deletedAt: null,
      });
      if (!customer) {
        throw new NotFoundException('No booking found for this email');
      }
      oldBooking = await this.bookingModel
        .findOne({
          tenantId: tid,
          customerId: customer._id,
          status: { $nin: ['cancelled'] },
        })
        .sort({ date: -1, timeSlot: -1 })
        .limit(1)
        .exec();
    }
    if (!oldBooking) {
      throw new NotFoundException('No booking found to reschedule');
    }

    const customer = await this.customerModel.findById(oldBooking.customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { date, timeSlot } = this.parseConfirmedSlot(newSlot);
    await this.assertSlotAvailable(tid, date, timeSlot, oldBooking._id);

    await this.bookingModel.updateOne(
      { _id: oldBooking._id, tenantId: tid },
      { $set: { status: 'cancelled' } },
    );
    await this.customerModel.updateOne(
      { _id: customer._id, tenantId: tid },
      { $inc: { totalBookings: -1 } },
    );

    const newBooking = await this.bookingModel.create({
      tenantId: tid,
      customerId: customer._id,
      providerId: oldBooking.providerId,
      locationId: oldBooking.locationId,
      serviceType: oldBooking.serviceType,
      date,
      timeSlot,
      durationMinutes: oldBooking.durationMinutes ?? 30,
      status: 'confirmed',
      notes: `Rescheduled via Retell tool (${timezone})`,
      reminderSent: false,
      reminderAt: null,
    });
    await this.customerModel.updateOne(
      { _id: customer._id, tenantId: tid },
      { $inc: { totalBookings: 1 } },
    );

    return {
      result: {
        old_meeting_id: oldBooking._id.toString(),
        new_meeting_id: newBooking._id.toString(),
        status: 'confirmed',
      },
    };
  }

  private async getAgentContext(agentId: string): Promise<AgentContext> {
    const agent = await this.agentModel.findById(agentId);
    if (!agent || agent.status === 'deleted') {
      throw new NotFoundException('Agent instance not found');
    }
    if (!agent.tenantId) {
      throw new NotFoundException('Tenant not found for this agent');
    }
    const tenant = await this.tenantModel.findOne({
      _id: agent.tenantId,
      deletedAt: null,
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found for this agent');
    }
    const template =
      agent.templateId != null
        ? await this.templateModel.findOne({
            _id: agent.templateId,
            deletedAt: null,
          })
        : null;
    return {
      agent: agent as AgentInstanceDocument & { tenantId: Types.ObjectId },
      tenant,
      template,
    };
  }

  private readCapabilityLevel(config: Record<string, unknown>): string | null {
    const value = config.capabilityLevel;
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private readSkills(config: Record<string, unknown>): string[] {
    const value = config.skills;
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private parseDate(rawDate: string): Date {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  }

  private getStartOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private getEndOfDay(date: Date): Date {
    const value = this.getStartOfDay(date);
    value.setDate(value.getDate() + 1);
    return value;
  }

  private buildCandidateSlots(
    date: Date,
    preferredTimeWindow: string,
  ): string[] {
    const normalized =
      typeof preferredTimeWindow === 'string'
        ? preferredTimeWindow.toLowerCase()
        : '';
    const startHour = normalized.includes('morning')
      ? 9
      : normalized.includes('afternoon')
        ? 13
        : normalized.includes('evening')
          ? 17
          : 9;
    const slots: string[] = [];
    for (let offset = 0; offset < 8; offset += 1) {
      const hour = startHour + offset;
      if (hour > 20) {
        break;
      }
      slots.push(
        `${date.toISOString().slice(0, 10)} ${String(hour).padStart(2, '0')}:00`,
      );
    }
    return slots;
  }

  private parseConfirmedSlot(confirmedSlot: string): {
    date: Date;
    timeSlot: string;
  } {
    const parsed = new Date(confirmedSlot);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        date: parsed,
        timeSlot: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
      };
    }
    const [datePart, timePart] = confirmedSlot.split(' ');
    const date = this.parseDate(datePart);
    return {
      date,
      timeSlot: timePart && /^\d{2}:\d{2}$/.test(timePart) ? timePart : '09:00',
    };
  }

  private async assertSlotAvailable(
    tenantId: Types.ObjectId,
    date: Date,
    timeSlot: string,
    excludeBookingId?: Types.ObjectId,
  ): Promise<void> {
    const existingConflict = await this.bookingModel.findOne({
      tenantId,
      date: { $gte: this.getStartOfDay(date), $lt: this.getEndOfDay(date) },
      timeSlot,
      status: { $nin: ['cancelled'] },
      ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
    });
    if (existingConflict) {
      throw new ConflictException(
        'The requested slot is no longer available. Please choose another time.',
      );
    }
  }

  private async findOrCreateRequester(tenantId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await this.userModel.findOne({
      email: normalizedEmail,
      deletedAt: null,
    });
    if (user) {
      return user;
    }
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    user = await this.userModel.findById(tenant.ownerId);
    if (!user) {
      throw new NotFoundException('Tenant owner not found');
    }
    return user;
  }

  private async findOrCreateCustomer(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.customerModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      email: normalizedEmail,
      deletedAt: null,
    });
    if (existing) {
      return existing;
    }
    const fullName = `${firstName} ${lastName}`.trim() || 'Guest';
    return this.customerModel.create({
      tenantId: new Types.ObjectId(tenantId),
      name: fullName,
      email: normalizedEmail,
      phone: null,
      source: 'chat',
      tags: ['retell'],
      metadata: {},
      totalBookings: 0,
      deletedAt: null,
    });
  }
}

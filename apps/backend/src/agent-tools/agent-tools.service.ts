import {
  BadRequestException,
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
  ProviderAvailability,
  ProviderAvailabilityDocument,
} from '../availability/schemas/provider-availability.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
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

interface HourWindow {
  startHour: number;
  endHour: number;
}

interface CandidateSlot {
  providerId: string | null;
  timeSlot: string;
  label: string;
  slotId: string;
  startsAt: string;
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
    @InjectModel(ProviderAvailability.name)
    private readonly providerAvailabilityModel: Model<ProviderAvailabilityDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(TenantStaff.name)
    private readonly tenantStaffModel: Model<TenantStaffDocument>,
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

  /**
   * Returns active clinic staff from the database with display names and weekly
   * availability windows (from `provider_availability`). Use so the voice agent
   * can name real doctors/providers before calling `get_available_slots`.
   *
   * @param agentId - Agent instance id (MongoDB ObjectId string)
   */
  async listProviders(agentId: string) {
    const context = await this.getAgentContext(agentId);
    const tid = context.agent.tenantId;

    const staffRows = await this.tenantStaffModel
      .find({ tenantId: tid, status: 'active' })
      .populate('userId', 'name email')
      .sort({ roleSlug: 1 })
      .exec();

    const staffIds = staffRows.map((s) => s._id);
    const availabilityRows =
      staffIds.length === 0
        ? []
        : await this.providerAvailabilityModel
            .find({
              tenantId: tid,
              providerId: { $in: staffIds },
            })
            .sort({ dayOfWeek: 1, startTime: 1 })
            .lean()
            .exec();

    const availByProvider = new Map<
      string,
      Array<{
        day_of_week: number;
        start_time: string;
        end_time: string;
      }>
    >();
    for (const row of availabilityRows) {
      const pid =
        row.providerId instanceof Types.ObjectId
          ? row.providerId.toString()
          : String(row.providerId);
      const list = availByProvider.get(pid) ?? [];
      list.push({
        day_of_week: row.dayOfWeek,
        start_time: row.startTime,
        end_time: row.endTime,
      });
      availByProvider.set(pid, list);
    }

    const providers = staffRows.map((s) => {
      const sid = s._id.toString();
      const populated = s.userId as
        | { name?: string; email?: string }
        | Types.ObjectId
        | null
        | undefined;
      const name =
        populated &&
        typeof populated === 'object' &&
        !(populated instanceof Types.ObjectId) &&
        typeof populated.name === 'string' &&
        populated.name.trim().length > 0
          ? populated.name.trim()
          : 'Staff';
      const email =
        populated &&
        typeof populated === 'object' &&
        !(populated instanceof Types.ObjectId) &&
        typeof populated.email === 'string'
          ? populated.email
          : undefined;

      return {
        provider_id: sid,
        name,
        role_slug: s.roleSlug,
        ...(email ? { email } : {}),
        weekly_hours: availByProvider.get(sid) ?? [],
      };
    });

    return {
      result: {
        providers,
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
    const dateKey = this.getIsoDayPrefix(date);
    const candidateSlots = await this.buildCandidateSlots(
      context,
      date,
      preferredTimeWindow,
    );
    const existing = await this.bookingModel.find({
      tenantId: context.agent.tenantId,
      date: {
        $gte: this.getStartOfDay(date),
        $lt: this.getEndOfDay(date),
      },
      status: { $nin: ['cancelled'] },
    });
    const globallyBooked = new Set(
      existing
        .filter((item) => item.providerId == null)
        .map((item) => item.timeSlot),
    );
    const bookedByProvider = new Set(
      existing
        .filter((item) => item.providerId != null)
        .map(
          (item) =>
            `${(item.providerId as Types.ObjectId).toString()}|${item.timeSlot}`,
        ),
    );
    const availableSlots = candidateSlots
      .filter((slot) => {
        if (globallyBooked.has(slot.timeSlot)) {
          return false;
        }
        if (!slot.providerId) {
          return true;
        }
        return !bookedByProvider.has(`${slot.providerId}|${slot.timeSlot}`);
      })
      .map((slot) => slot.label)
      .slice(0, 5);
    const availableSlotOptions = candidateSlots
      .filter((slot) => {
        if (globallyBooked.has(slot.timeSlot)) {
          return false;
        }
        if (!slot.providerId) {
          return true;
        }
        return !bookedByProvider.has(`${slot.providerId}|${slot.timeSlot}`);
      })
      .slice(0, 10)
      .map((slot) => ({
        slot_id: slot.slotId,
        date: dateKey,
        time_slot: slot.timeSlot,
        start_at: slot.startsAt,
        provider_id: slot.providerId,
        label: slot.label,
      }));
    return {
      result: {
        timezone,
        available_slots: availableSlots,
        available_slot_options: availableSlotOptions,
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
    const slotId =
      this.readString(extras.slot_id) ?? this.readString(extras.confirmed_slot_id);
    const { date, timeSlot, providerId } = this.parseConfirmedSlot(
      confirmedSlot,
      slotId ?? undefined,
    );
    await this.assertSlotAvailable(
      context.agent.tenantId,
      date,
      timeSlot,
      providerId,
    );
    const booking = await this.bookingModel.create({
      tenantId: context.agent.tenantId,
      customerId: customer._id,
      providerId,
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
      const activeBookings = await this.bookingModel
        .find({
          tenantId: tid,
          customerId: customer._id,
          status: { $nin: ['cancelled'] },
        })
        .sort({ date: -1, timeSlot: -1 })
        .limit(5)
        .exec();
      if (activeBookings.length > 1) {
        throw new ConflictException(
          'Multiple active bookings found. Provide meeting_id to cancel a specific appointment.',
        );
      }
      booking = activeBookings[0] ?? null;
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
      const activeBookings = await this.bookingModel
        .find({
          tenantId: tid,
          customerId: customer._id,
          status: { $nin: ['cancelled'] },
        })
        .sort({ date: -1, timeSlot: -1 })
        .limit(5)
        .exec();
      if (activeBookings.length > 1) {
        throw new ConflictException(
          'Multiple active bookings found. Provide meeting_id to reschedule a specific appointment.',
        );
      }
      oldBooking = activeBookings[0] ?? null;
    }
    if (!oldBooking) {
      throw new NotFoundException('No booking found to reschedule');
    }

    const customer = await this.customerModel.findById(oldBooking.customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const requestedSlotId = this.readString(newSlot);
    const parsedSlot = this.parseConfirmedSlot(
      newSlot,
      requestedSlotId?.includes('|') ? requestedSlotId : undefined,
    );
    const { date, timeSlot, providerId } = parsedSlot;
    await this.assertSlotAvailable(
      tid,
      date,
      timeSlot,
      providerId,
      oldBooking._id,
    );

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
      providerId: providerId ?? oldBooking.providerId,
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
    if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
      throw new BadRequestException('preferred_date must be YYYY-MM-DD');
    }
    const [year, month, day] = rawDate.split('-').map((part) => Number(part));
    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid preferred_date');
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

  private async buildCandidateSlots(
    context: AgentContext,
    date: Date,
    preferredTimeWindow: string,
  ): Promise<CandidateSlot[]> {
    const dayOfWeek = this.getStartOfDay(date).getDay();
    const preferredWindow = this.parsePreferredWindow(preferredTimeWindow);

    const providerAvailability = await this.providerAvailabilityModel.find({
      tenantId: context.agent.tenantId,
      dayOfWeek,
    });

    const slots: CandidateSlot[] = [];
    const dayPrefix = this.getIsoDayPrefix(date);

    if (providerAvailability.length === 0) {
      const settingsSlots = await this.buildSlotsFromTenantSettings(
        context,
        date,
        preferredWindow,
      );
      if (settingsSlots.length > 0) {
        return settingsSlots;
      }
      for (
        let hour = preferredWindow.startHour;
        hour < preferredWindow.endHour && hour <= 20;
        hour += 1
      ) {
        const timeSlot = `${String(hour).padStart(2, '0')}:00`;
        slots.push({
          providerId: null,
          timeSlot,
          label: `${dayPrefix} ${timeSlot}`,
          slotId: this.buildSlotId(dayPrefix, timeSlot, null),
          startsAt: `${dayPrefix}T${timeSlot}:00`,
        });
      }
      return slots;
    }

    for (const availability of providerAvailability) {
      const [windowStartHour, windowStartMinute] = availability.startTime
        .split(':')
        .map((part) => Number(part));
      const [windowEndHour, windowEndMinute] = availability.endTime
        .split(':')
        .map((part) => Number(part));

      let slotCursor = (windowStartHour ?? 9) * 60 + (windowStartMinute ?? 0);
      const windowEnd = (windowEndHour ?? 17) * 60 + (windowEndMinute ?? 0);

      while (slotCursor + 30 <= windowEnd) {
        const hour = Math.floor(slotCursor / 60);
        const minute = slotCursor % 60;
        if (
          hour >= preferredWindow.startHour &&
          hour < preferredWindow.endHour &&
          hour <= 20
        ) {
          const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          slots.push({
            providerId: availability.providerId.toString(),
            timeSlot,
            label: `${dayPrefix} ${timeSlot}`,
            slotId: this.buildSlotId(
              dayPrefix,
              timeSlot,
              availability.providerId.toString(),
            ),
            startsAt: `${dayPrefix}T${timeSlot}:00`,
          });
        }
        slotCursor += 30;
      }
    }

    const unique = new Map<string, CandidateSlot>();
    for (const slot of slots) {
      const key = `${slot.providerId ?? 'none'}|${slot.timeSlot}`;
      if (!unique.has(key)) {
        unique.set(key, slot);
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.timeSlot.localeCompare(b.timeSlot),
    );
  }

  private async buildSlotsFromTenantSettings(
    context: AgentContext,
    date: Date,
    preferredWindow: HourWindow,
  ): Promise<CandidateSlot[]> {
    const settings = context.tenant.settings as
      | { providerAvailability?: Record<string, unknown> }
      | undefined;
    const rawProviderAvailability = settings?.providerAvailability;
    if (
      !rawProviderAvailability ||
      typeof rawProviderAvailability !== 'object' ||
      Array.isArray(rawProviderAvailability)
    ) {
      return [];
    }

    const staffRows = await this.tenantStaffModel.find({
      tenantId: context.agent.tenantId,
      status: 'active',
    });
    const providerIdByUserId = new Map(
      staffRows.map((row) => [row.userId.toString(), row._id.toString()]),
    );

    const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
      this.getStartOfDay(date).getDay()
    ];
    const dayPrefix = this.getIsoDayPrefix(date);
    const slots: CandidateSlot[] = [];

    for (const [userId, value] of Object.entries(rawProviderAvailability)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        continue;
      }
      const availability = (value as { availability?: unknown }).availability;
      if (!Array.isArray(availability)) {
        continue;
      }
      for (const row of availability) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          continue;
        }
        const day = (row as { day?: unknown }).day;
        const start = (row as { start?: unknown }).start;
        const end = (row as { end?: unknown }).end;
        if (day !== dayKey || typeof start !== 'string' || typeof end !== 'string') {
          continue;
        }
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        let cursorMinutes = (startHour ?? 9) * 60 + (startMinute ?? 0);
        const endMinutes = (endHour ?? 17) * 60 + (endMinute ?? 0);
        while (cursorMinutes + 30 <= endMinutes) {
          const hour = Math.floor(cursorMinutes / 60);
          const minute = cursorMinutes % 60;
          if (
            hour >= preferredWindow.startHour &&
            hour < preferredWindow.endHour &&
            hour <= 20
          ) {
            const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            slots.push({
              providerId: providerIdByUserId.get(userId) ?? null,
              timeSlot,
              label: `${dayPrefix} ${timeSlot}`,
              slotId: this.buildSlotId(
                dayPrefix,
                timeSlot,
                providerIdByUserId.get(userId) ?? null,
              ),
              startsAt: `${dayPrefix}T${timeSlot}:00`,
            });
          }
          cursorMinutes += 30;
        }
      }
    }

    const unique = new Map<string, CandidateSlot>();
    for (const slot of slots) {
      const key = `${slot.providerId ?? 'none'}|${slot.timeSlot}`;
      if (!unique.has(key)) {
        unique.set(key, slot);
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.timeSlot.localeCompare(b.timeSlot),
    );
  }

  private getIsoDayPrefix(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private parsePreferredWindow(rawValue: string): HourWindow {
    const normalized = rawValue.toLowerCase().trim();
    const rangeMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (rangeMatch) {
      const startHour = Number(rangeMatch[1]);
      const endHour = Number(rangeMatch[3]);
      if (
        Number.isFinite(startHour) &&
        Number.isFinite(endHour) &&
        startHour >= 0 &&
        endHour <= 24 &&
        endHour > startHour
      ) {
        return { startHour, endHour };
      }
    }
    if (normalized.includes('morning')) {
      return { startHour: 8, endHour: 12 };
    }
    if (normalized.includes('afternoon')) {
      return { startHour: 12, endHour: 17 };
    }
    if (normalized.includes('evening')) {
      return { startHour: 17, endHour: 21 };
    }
    return { startHour: 8, endHour: 21 };
  }

  private parseConfirmedSlot(
    confirmedSlot: string,
    slotId?: string,
  ): {
    date: Date;
    timeSlot: string;
    providerId: Types.ObjectId | null;
  } {
    const decodedSlot = slotId ? this.decodeSlotId(slotId) : null;
    if (decodedSlot) {
      const [year, month, day] = decodedSlot.date.split('-').map(Number);
      return {
        date: new Date(year, month - 1, day),
        timeSlot: decodedSlot.timeSlot,
        providerId: decodedSlot.providerId
          ? new Types.ObjectId(decodedSlot.providerId)
          : null,
      };
    }
    const parsed = new Date(confirmedSlot);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        date: parsed,
        timeSlot: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
        providerId: null,
      };
    }
    const [datePart, timePart] = confirmedSlot.split(' ');
    const date =
      datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)
        ? this.parseDate(datePart)
        : null;
    if (!date) {
      throw new BadRequestException(
        'confirmed_slot/new_slot must be ISO datetime, "YYYY-MM-DD HH:mm", or slot_id',
      );
    }
    return {
      date,
      timeSlot:
        timePart && /^\d{2}:\d{2}$/.test(timePart)
          ? timePart
          : (() => {
              throw new BadRequestException(
                'confirmed_slot/new_slot time must be HH:mm',
              );
            })(),
      providerId: null,
    };
  }

  private async assertSlotAvailable(
    tenantId: Types.ObjectId,
    date: Date,
    timeSlot: string,
    providerId?: Types.ObjectId | null,
    excludeBookingId?: Types.ObjectId,
  ): Promise<void> {
    const existingConflict = await this.bookingModel.findOne({
      tenantId,
      date: { $gte: this.getStartOfDay(date), $lt: this.getEndOfDay(date) },
      timeSlot,
      status: { $nin: ['cancelled'] },
      ...(providerId
        ? {
            $or: [{ providerId }, { providerId: null }],
          }
        : {}),
      ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
    });
    if (existingConflict) {
      throw new ConflictException(
        'The requested slot is no longer available. Please choose another time.',
      );
    }
  }

  private buildSlotId(
    dateKey: string,
    timeSlot: string,
    providerId: string | null,
  ): string {
    return `${dateKey}|${timeSlot}|${providerId ?? 'any'}`;
  }

  private decodeSlotId(slotId: string): {
    date: string;
    timeSlot: string;
    providerId: string | null;
  } | null {
    const [date, timeSlot, providerKey] = slotId.split('|');
    if (!date || !timeSlot || !providerKey) {
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(timeSlot)) {
      return null;
    }
    if (providerKey === 'any') {
      return { date, timeSlot, providerId: null };
    }
    if (!Types.ObjectId.isValid(providerKey)) {
      return null;
    }
    return { date, timeSlot, providerId: providerKey };
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

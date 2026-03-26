import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../common/constants';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private notificationsService: NotificationsService,
    @Optional() private emailService: EmailService | null,
  ) {}

  async findAllForTenant(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      date?: string;
      status?: string;
      start?: string;
      end?: string;
    },
  ) {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      date,
      status,
      start,
      end,
    } = query;
    const filter: FilterQuery<BookingDocument> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (date) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.date = { $gte: dayStart, $lt: dayEnd };
    }
    if (start || end) {
      const gte = start ? new Date(start) : undefined;
      const lte = end ? new Date(end) : undefined;
      if (gte && Number.isNaN(gte.getTime())) {
        throw new BadRequestException('Invalid start date');
      }
      if (lte && Number.isNaN(lte.getTime())) {
        throw new BadRequestException('Invalid end date');
      }
      filter.date = {
        ...(gte ? { $gte: gte } : {}),
        ...(lte ? { $lte: lte } : {}),
      };
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

  async findOneForTenant(id: string, tenantId: string) {
    const booking = await this.bookingModel
      .findOne({
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('customerId', 'name email phone')
      .populate('providerId')
      .lean();

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
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
        date: {
          $gte: this.getStartOfDay(new Date(dto.date)),
          $lt: this.getEndOfDay(new Date(dto.date)),
        },
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
    const tid = new Types.ObjectId(tenantId);
    const oldBooking = await this.bookingModel
      .findOne({
        _id: id,
        tenantId: tid,
      })
      .populate<{ customerId: CustomerDocument }>(
        'customerId',
        'name email phone',
      )
      .lean();
    if (!oldBooking) throw new NotFoundException('Booking not found');

    const wasCancelled = oldBooking.status === 'cancelled';
    const isCancelling = dto.status === 'cancelled';
    const isRescheduling =
      (dto.date != null || dto.timeSlot != null) && !isCancelling;

    const updateObj: Record<string, unknown> = {};
    if (dto.status != null) updateObj.status = dto.status;
    if (dto.notes != null) updateObj.notes = dto.notes;
    if (dto.durationMinutes != null)
      updateObj.durationMinutes = dto.durationMinutes;
    if (dto.date != null) updateObj.date = new Date(dto.date);
    if (dto.timeSlot != null) updateObj.timeSlot = dto.timeSlot;

    if (isRescheduling) {
      const newDate = dto.date ? new Date(dto.date) : oldBooking.date;
      const newTimeSlot = dto.timeSlot ?? oldBooking.timeSlot;
      const oldProviderId =
        oldBooking.providerId && typeof oldBooking.providerId === 'object'
          ? new Types.ObjectId(
              (oldBooking.providerId as { _id?: Types.ObjectId })._id ??
                oldBooking.providerId,
            )
          : oldBooking.providerId
            ? new Types.ObjectId(oldBooking.providerId as unknown as string)
            : null;
      const conflict = await this.bookingModel.findOne({
        tenantId: tid,
        ...(oldProviderId
          ? { providerId: oldProviderId }
          : { providerId: null }),
        _id: { $ne: new Types.ObjectId(id) },
        date: {
          $gte: this.getStartOfDay(newDate),
          $lt: this.getEndOfDay(newDate),
        },
        timeSlot: newTimeSlot,
        status: { $nin: ['cancelled'] },
      });
      if (conflict) {
        throw new ConflictException(
          'This provider already has a booking at the selected date and time slot',
        );
      }
    }

    const customerRef = oldBooking.customerId as
      | { _id: Types.ObjectId; name?: string; email?: string | null }
      | Types.ObjectId;
    const customerId =
      typeof customerRef === 'object' &&
      customerRef !== null &&
      '_id' in customerRef
        ? customerRef._id
        : (customerRef as Types.ObjectId);
    const customerEmail =
      typeof customerRef === 'object' &&
      customerRef !== null &&
      'email' in customerRef &&
      customerRef.email
        ? String(customerRef.email)
        : null;
    const customerName =
      typeof customerRef === 'object' &&
      customerRef !== null &&
      'name' in customerRef &&
      customerRef.name
        ? String(customerRef.name)
        : 'Customer';

    const booking = await this.bookingModel.findOneAndUpdate(
      { _id: id, tenantId: tid },
      { $set: updateObj },
      { new: true },
    );

    if (!booking) throw new NotFoundException('Booking not found');

    if (!wasCancelled && isCancelling) {
      await this.customerModel.updateOne(
        { _id: customerId, tenantId: tid },
        { $inc: { totalBookings: -1 } },
      );
    }

    if (this.emailService && customerEmail) {
      const tenant = await this.tenantModel.findById(tenantId).lean();
      const clinicName = tenant?.name ?? 'the clinic';

      if (!wasCancelled && isCancelling) {
        const dateStr = oldBooking.date.toLocaleDateString();
        const timeSlot = oldBooking.timeSlot ?? '09:00';
        this.emailService
          .sendBookingCancellation(
            customerEmail,
            customerName,
            dateStr,
            timeSlot,
            clinicName,
          )
          .catch((err) =>
            this.logger.warn(
              `Failed to send cancellation email: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
      } else if (isRescheduling && (dto.date != null || dto.timeSlot != null)) {
        const oldDateStr = oldBooking.date.toLocaleDateString();
        const oldTime = oldBooking.timeSlot ?? '09:00';
        const newDateStr = booking.date.toLocaleDateString();
        const newTime = booking.timeSlot ?? '09:00';
        this.emailService
          .sendBookingReschedule(
            customerEmail,
            customerName,
            oldDateStr,
            oldTime,
            newDateStr,
            newTime,
            clinicName,
          )
          .catch((err) =>
            this.logger.warn(
              `Failed to send reschedule email: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
      }
    }

    return booking;
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

  async upsertFromCalcomWebhook(rawPayload: Record<string, unknown>) {
    const payload = this.extractPayload(rawPayload);
    const providerBookingId = this.readString(
      payload.uid ?? payload.bookingUid ?? payload.id ?? payload.bookingId,
    );
    if (!providerBookingId) {
      return {
        processed: false,
        reason: 'missing_provider_booking_id' as const,
      };
    }

    const tenantIdValue = this.readString(
      payload.tenantId ??
        payload.tenant_id ??
        payload?.metadata?.tenantId ??
        payload?.metadata?.tenant_id,
    );

    if (!tenantIdValue || !Types.ObjectId.isValid(tenantIdValue)) {
      this.logger.warn(
        `Cal.com booking ${providerBookingId} ignored: missing/invalid tenantId metadata`,
      );
      return { processed: false, reason: 'missing_tenant_id' as const };
    }

    const tenantId = new Types.ObjectId(tenantIdValue);

    const eventType = this.readString(
      rawPayload?.triggerEvent ?? rawPayload?.eventType ?? rawPayload?.event,
    );
    const status = this.mapCalcomStatus(
      eventType,
      this.readString(payload.status) ?? 'confirmed',
    );

    const start = this.readDate(
      payload.startTime ?? payload.start ?? payload.startAt ?? payload.startsAt,
    );
    const end = this.readDate(
      payload.endTime ?? payload.end ?? payload.endAt ?? payload.endsAt,
    );

    if (!start) {
      return { processed: false, reason: 'missing_start_time' as const };
    }

    const attendee = this.extractPrimaryAttendee(payload);
    const customer = await this.findOrCreateCustomerForTenant(
      tenantId,
      attendee,
    );

    const durationMinutes = end
      ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
      : 30;

    const title =
      this.readString(
        payload.title ?? payload.eventTypeTitle ?? payload.type,
      ) ?? 'Appointment';

    const timeSlot = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;

    const updateDoc: Partial<Booking> = {
      source: 'calcom',
      provider: 'calcom',
      providerBookingId,
      tenantId,
      customerId: customer._id,
      serviceType: title,
      date: start,
      timeSlot,
      durationMinutes,
      status,
      notes: null,
      providerUpdatedAt: new Date(),
    };

    await this.bookingModel.updateOne(
      { tenantId, provider: 'calcom', providerBookingId },
      {
        $set: updateDoc,
        $setOnInsert: { reminderSent: false, reminderAt: null },
      },
      { upsert: true },
    );

    return { processed: true, bookingId: providerBookingId };
  }

  private extractPayload(
    rawPayload: Record<string, unknown>,
  ): Record<string, any> {
    const p = rawPayload as Record<string, any>;
    if (p && typeof p.payload === 'object' && p.payload) {
      const payload = p.payload as Record<string, any>;
      if (payload.booking && typeof payload.booking === 'object')
        return payload.booking as Record<string, any>;
      return payload;
    }
    if (p && typeof p.booking === 'object' && p.booking)
      return p.booking as Record<string, any>;
    return p;
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private readDate(value: unknown): Date | null {
    if (typeof value !== 'string') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  private mapCalcomStatus(eventType: string | null, fallback: string): string {
    const normalized = (eventType ?? '').toLowerCase();
    if (normalized.includes('cancel')) return 'cancelled';
    if (normalized.includes('resched')) return 'confirmed';
    if (normalized.includes('create')) return 'confirmed';
    return ['confirmed', 'cancelled', 'completed', 'no_show'].includes(fallback)
      ? fallback
      : 'confirmed';
  }

  private extractPrimaryAttendee(payload: Record<string, any>): {
    name: string;
    email: string | null;
    phone: string | null;
  } {
    const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
    const first = attendees[0] ?? payload.attendee ?? {};

    const name = this.readString(first?.name ?? payload.name) ?? 'Customer';
    const email = this.readString(first?.email ?? payload.email);
    const phone = this.readString(
      first?.phoneNumber ?? first?.phone ?? payload.phone,
    );
    return { name, email, phone };
  }

  private async findOrCreateCustomerForTenant(
    tenantId: Types.ObjectId,
    attendee: { name: string; email: string | null; phone: string | null },
  ) {
    const lookup: FilterQuery<CustomerDocument> = { tenantId, deletedAt: null };
    if (attendee.email) {
      lookup.email = attendee.email;
    } else if (attendee.phone) {
      lookup.phone = attendee.phone;
    } else {
      lookup.name = attendee.name;
    }

    let customer = await this.customerModel.findOne(lookup);
    if (customer) return customer;

    customer = await this.customerModel.create({
      tenantId,
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone,
      source: 'call',
      tags: ['calcom'],
      metadata: { origin: 'calcom_webhook' },
      totalBookings: 0,
      deletedAt: null,
    });

    return customer;
  }
}

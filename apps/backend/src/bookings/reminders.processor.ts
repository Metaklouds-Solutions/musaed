import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class RemindersProcessor {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processReminders(): Promise<void> {
    const tenants = await this.tenantModel
      .find({ deletedAt: null })
      .select('_id settings')
      .lean();

    for (const tenant of tenants) {
      const settings = tenant.settings as { notifications?: { bookingReminders?: boolean }; appointmentReminders?: { advanceMinutes?: number; channel?: string } } | undefined;
      if (!settings?.notifications?.bookingReminders) continue;

      const advanceMinutes = settings.appointmentReminders?.advanceMinutes ?? 60;
      const channel = settings.appointmentReminders?.channel ?? 'email';
      if (channel !== 'email') continue;

      const now = new Date();
      const targetTime = new Date(now.getTime() + advanceMinutes * 60 * 1000);
      const targetDateStr = targetTime.toISOString().slice(0, 10);
      const targetHour = targetTime.getHours();
      const targetMin = targetTime.getMinutes();

      const bookings = await this.bookingModel
        .find({
          tenantId: tenant._id,
          status: { $nin: ['cancelled'] },
          reminderSent: false,
          date: {
            $gte: new Date(targetDateStr),
            $lt: new Date(new Date(targetDateStr).getTime() + 24 * 60 * 60 * 1000),
          },
        })
        .populate('customerId', 'name email')
        .limit(100)
        .lean();

      const toSend = bookings.filter((b) => {
        const slot = (b as { timeSlot?: string }).timeSlot ?? '09:00';
        const [h, m] = slot.split(':').map(Number);
        return Math.abs((h - targetHour) * 60 + (m - targetMin)) <= 2;
      });

      for (const b of toSend) {
        const customer = b.customerId as { _id?: unknown; name?: string; email?: string } | null;
        if (!customer?.email) continue;

        const date = (b as { date?: Date }).date;
        const timeSlot = (b as { timeSlot?: string }).timeSlot ?? '09:00';
        const customerName = customer.name ?? 'Customer';

        try {
          await this.emailService.sendAppointmentReminder(
            customer.email,
            customerName,
            date ? new Date(date) : new Date(),
            timeSlot,
          );
          await this.bookingModel.updateOne(
            { _id: (b as { _id?: unknown })._id },
            { $set: { reminderSent: true, reminderAt: new Date() } },
          );
          this.logger.log(`Reminder sent for booking ${(b as { _id?: unknown })._id}`);
        } catch (err) {
          this.logger.error(`Failed to send reminder for booking ${(b as { _id?: unknown })._id}`, err instanceof Error ? err.stack : err);
        }
      }
    }
  }
}

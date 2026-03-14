import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { RemindersProcessor } from './reminders.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, RemindersProcessor, PermissionsGuard],
  exports: [BookingsService, MongooseModule],
})
export class BookingsModule {}

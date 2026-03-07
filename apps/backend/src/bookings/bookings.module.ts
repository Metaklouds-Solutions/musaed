import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, MongooseModule],
})
export class BookingsModule {}

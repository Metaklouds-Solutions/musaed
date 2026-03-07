import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { AgentInstance, AgentInstanceSchema } from '../agent-instances/schemas/agent-instance.schema';
import { SupportTicket, SupportTicketSchema } from '../support/schemas/support-ticket.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgentInstance,
  AgentInstanceSchema,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  AgentTemplate,
  AgentTemplateSchema,
} from '../agent-templates/schemas/agent-template.schema';
import {
  SupportTicket,
  SupportTicketSchema,
} from '../support/schemas/support-ticket.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CallSession, CallSessionSchema } from '../calls/schemas/call-session.schema';
import { AgentToolsController } from './agent-tools.controller';
import { AgentToolsService } from './agent-tools.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: AgentTemplate.name, schema: AgentTemplateSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
  ],
  controllers: [AgentToolsController],
  providers: [AgentToolsService],
  exports: [AgentToolsService],
})
export class AgentToolsModule {}

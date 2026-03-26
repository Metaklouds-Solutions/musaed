import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import {
  TenantStaff,
  TenantStaffSchema,
} from '../tenants/schemas/tenant-staff.schema';
import {
  AgentInstance,
  AgentInstanceSchema,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  SupportTicket,
  SupportTicketSchema,
} from '../support/schemas/support-ticket.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import {
  CallSession,
  CallSessionSchema,
} from '../calls/schemas/call-session.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: TenantStaff.name, schema: TenantStaffSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

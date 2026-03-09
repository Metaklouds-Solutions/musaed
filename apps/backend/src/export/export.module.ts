import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportTenantController, ExportAdminController } from './export.controller';
import { ExportService } from './export.service';
import { TenantStaff, TenantStaffSchema } from '../tenants/schemas/tenant-staff.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SupportTicket, SupportTicketSchema } from '../support/schemas/support-ticket.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantStaff.name, schema: TenantStaffSchema },
      { name: User.name, schema: UserSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [ExportTenantController, ExportAdminController],
  providers: [ExportService],
})
export class ExportModule {}

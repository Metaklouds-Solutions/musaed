import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { TenantStaff, TenantStaffSchema } from '../tenants/schemas/tenant-staff.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SupportTicket, SupportTicketSchema } from '../support/schemas/support-ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: TenantStaff.name, schema: TenantStaffSchema },
      { name: User.name, schema: UserSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

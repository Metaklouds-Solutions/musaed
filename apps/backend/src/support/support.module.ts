import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportTicket, SupportTicketSchema } from './schemas/support-ticket.schema';
import { SupportTenantController, SupportAdminController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  controllers: [SupportTenantController, SupportAdminController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallSession, CallSessionSchema } from './schemas/call-session.schema';
import {
  TenantCallsController,
  AdminCallsController,
} from './calls.controller';
import { CallsService } from './calls.service';
import { RetellModule } from '../retell/retell.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CallChangeStreamService } from './call-change-stream.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
    RetellModule,
    NotificationsModule,
  ],
  controllers: [TenantCallsController, AdminCallsController],
  providers: [CallsService, CallChangeStreamService],
  exports: [CallsService, MongooseModule],
})
export class CallsModule {}

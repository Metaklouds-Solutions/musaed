import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallSession, CallSessionSchema } from './schemas/call-session.schema';
import { TenantCallsController, AdminCallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { RetellModule } from '../retell/retell.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
    RetellModule,
  ],
  controllers: [TenantCallsController, AdminCallsController],
  providers: [CallsService],
  exports: [CallsService, MongooseModule],
})
export class CallsModule {}

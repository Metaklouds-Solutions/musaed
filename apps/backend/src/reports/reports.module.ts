import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import {
  CallSession,
  CallSessionSchema,
} from '../calls/schemas/call-session.schema';
import {
  AgentInstance,
  AgentInstanceSchema,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  ReportSnapshot,
  ReportSnapshotSchema,
} from './schemas/report-snapshot.schema';
import { ReportsController } from './reports.controller';
import { AdminReportsController } from './admin-reports.controller';
import { ReportsService } from './reports.service';
import { ReportAggregationService } from './report-aggregation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: CallSession.name, schema: CallSessionSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: ReportSnapshot.name, schema: ReportSnapshotSchema },
    ]),
  ],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService, ReportAggregationService],
})
export class ReportsModule {}

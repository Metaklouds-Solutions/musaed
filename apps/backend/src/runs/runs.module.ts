import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RunsController } from './runs.controller';
import { TenantRunsController } from './tenant-runs.controller';
import { RunsService } from './runs.service';
import { AgentRun, AgentRunSchema } from './schemas/agent-run.schema';
import { RunEvent, RunEventSchema } from './schemas/run-event.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentRun.name, schema: AgentRunSchema },
      { name: RunEvent.name, schema: RunEventSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [RunsController, TenantRunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}

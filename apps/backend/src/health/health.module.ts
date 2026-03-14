import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { RetellModule } from '../retell/retell.module';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemMonitorService } from './system-monitor.service';
import {
  AgentInstance,
  AgentInstanceSchema,
} from '../agent-instances/schemas/agent-instance.schema';

@Module({
  imports: [
    RetellModule,
    AgentDeploymentsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: AgentInstance.name, schema: AgentInstanceSchema },
    ]),
    BullModule.registerQueue({ name: QUEUE_NAMES.WEBHOOKS }),
  ],
  controllers: [HealthController],
  providers: [SystemMonitorService],
})
export class HealthModule {}

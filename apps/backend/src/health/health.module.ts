import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { RetellModule } from '../retell/retell.module';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';
import { QUEUE_NAMES } from '../queue/queue.constants';

@Module({
  imports: [
    RetellModule,
    AgentDeploymentsModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.WEBHOOKS }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}

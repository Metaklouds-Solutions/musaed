import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RetellModule } from '../retell/retell.module';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';

@Module({
  imports: [RetellModule, AgentDeploymentsModule],
  controllers: [HealthController],
})
export class HealthModule {}

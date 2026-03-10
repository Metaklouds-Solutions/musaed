import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgentInstance,
  AgentInstanceSchema,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  AgentTemplate,
  AgentTemplateSchema,
} from '../agent-templates/schemas/agent-template.schema';
import { RetellModule } from '../retell/retell.module';
import { AuditModule } from '../audit/audit.module';
import { AgentDeploymentService } from './agent-deployment.service';
import {
  AgentChannelDeployment,
  AgentChannelDeploymentSchema,
} from './schemas/agent-channel-deployment.schema';
import { AgentDeploymentsService } from './agent-deployments.service';
import { AgentDeploymentMetricsService } from './agent-deployment-metrics.service';
import { AgentRolloutService } from './agent-rollout.service';

@Module({
  imports: [
    RetellModule,
    AuditModule,
    MongooseModule.forFeature([
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: AgentTemplate.name, schema: AgentTemplateSchema },
      { name: AgentChannelDeployment.name, schema: AgentChannelDeploymentSchema },
    ]),
  ],
  providers: [
    AgentDeploymentsService,
    AgentDeploymentService,
    AgentDeploymentMetricsService,
    AgentRolloutService,
  ],
  exports: [
    AgentDeploymentsService,
    AgentDeploymentService,
    AgentDeploymentMetricsService,
    AgentRolloutService,
    MongooseModule,
  ],
})
export class AgentDeploymentsModule {}

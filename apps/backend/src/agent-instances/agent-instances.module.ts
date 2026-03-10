import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentInstance, AgentInstanceSchema } from './schemas/agent-instance.schema';
import {
  AgentsTenantController,
  AgentsAdminController,
  AgentsAdminV1Controller,
} from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';
import { AgentTemplate, AgentTemplateSchema } from '../agent-templates/schemas/agent-template.schema';

@Module({
  imports: [
    AgentDeploymentsModule,
    MongooseModule.forFeature([
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: AgentTemplate.name, schema: AgentTemplateSchema },
    ]),
  ],
  controllers: [AgentsTenantController, AgentsAdminController, AgentsAdminV1Controller],
  providers: [AgentsService],
  exports: [AgentsService, MongooseModule],
})
export class AgentInstancesModule {}

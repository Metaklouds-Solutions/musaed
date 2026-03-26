import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgentInstance,
  AgentInstanceSchema,
} from './schemas/agent-instance.schema';
import {
  AgentsTenantController,
  AgentsAdminController,
  AgentsAdminV1Controller,
} from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentHealthService } from './agent-health.service';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';
import {
  AgentTemplate,
  AgentTemplateSchema,
} from '../agent-templates/schemas/agent-template.schema';
import {
  CallSession,
  CallSessionSchema,
} from '../calls/schemas/call-session.schema';
import { RetellModule } from '../retell/retell.module';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AgentDeploymentsModule,
    RetellModule,
    AlertsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: AgentTemplate.name, schema: AgentTemplateSchema },
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
  ],
  controllers: [
    AgentsTenantController,
    AgentsAdminController,
    AgentsAdminV1Controller,
  ],
  providers: [AgentsService, AgentHealthService],
  exports: [AgentsService, AgentHealthService, MongooseModule],
})
export class AgentInstancesModule {}

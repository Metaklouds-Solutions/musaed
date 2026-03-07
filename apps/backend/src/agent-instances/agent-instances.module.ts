import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentInstance, AgentInstanceSchema } from './schemas/agent-instance.schema';
import { AgentsTenantController, AgentsAdminController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentInstance.name, schema: AgentInstanceSchema },
    ]),
  ],
  controllers: [AgentsTenantController, AgentsAdminController],
  providers: [AgentsService],
  exports: [AgentsService, MongooseModule],
})
export class AgentInstancesModule {}

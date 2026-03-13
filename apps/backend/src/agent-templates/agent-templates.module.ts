import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgentTemplate,
  AgentTemplateSchema,
} from './schemas/agent-template.schema';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentTemplate.name, schema: AgentTemplateSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService, MongooseModule],
})
export class AgentTemplatesModule {}

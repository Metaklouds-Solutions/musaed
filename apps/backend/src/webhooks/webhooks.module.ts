import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { AgentInstance, AgentInstanceSchema } from '../agent-instances/schemas/agent-instance.schema';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';
import { CallSession, CallSessionSchema } from '../calls/schemas/call-session.schema';
import { AgentRun, AgentRunSchema } from '../runs/schemas/agent-run.schema';
import { RunEvent, RunEventSchema } from '../runs/schemas/run-event.schema';
import { StripeWebhookController } from './stripe.webhook.controller';
import { RetellWebhookController } from './retell.webhook.controller';
import { WebhooksService } from './webhooks.service';
import { QueueModule } from '../queue/queue.module';
import { WebhookProcessor } from '../queue/webhook.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
      { name: CallSession.name, schema: CallSessionSchema },
      { name: AgentRun.name, schema: AgentRunSchema },
      { name: RunEvent.name, schema: RunEventSchema },
    ]),
    QueueModule.forRoot(),
  ],
  controllers: [StripeWebhookController, RetellWebhookController],
  providers: [WebhooksService, WebhookProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}

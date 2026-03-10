import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { AgentInstance, AgentInstanceSchema } from '../agent-instances/schemas/agent-instance.schema';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';
import { CallSession, CallSessionSchema } from '../calls/schemas/call-session.schema';
import { StripeWebhookController } from './stripe.webhook.controller';
import { RetellWebhookController } from './retell.webhook.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
      { name: CallSession.name, schema: CallSessionSchema },
    ]),
  ],
  controllers: [StripeWebhookController, RetellWebhookController],
  providers: [WebhooksService],
})
export class WebhooksModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import {
  AgentInstance,
  AgentInstanceSchema,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  ProcessedEvent,
  ProcessedEventSchema,
} from './schemas/processed-event.schema';
import {
  CallSession,
  CallSessionSchema,
} from '../calls/schemas/call-session.schema';
import { AgentRun, AgentRunSchema } from '../runs/schemas/agent-run.schema';
import { RunEvent, RunEventSchema } from '../runs/schemas/run-event.schema';
import { StripeWebhookController } from './stripe.webhook.controller';
import { RetellWebhookController } from './retell.webhook.controller';
import { CalcomWebhookController } from './calcom.webhook.controller';
import { AdminProcessedWebhookEventsController } from './admin-processed-webhook-events.controller';
import { WebhooksService } from './webhooks.service';
import { QueueModule } from '../queue/queue.module';
import { WebhookProcessor } from '../queue/webhook.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';

@Module({
  imports: [
    BookingsModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
      { name: CallSession.name, schema: CallSessionSchema },
      { name: AgentRun.name, schema: AgentRunSchema },
      { name: RunEvent.name, schema: RunEventSchema },
    ]),
    QueueModule.forRoot(),
    NotificationsModule,
    AgentDeploymentsModule,
  ],
  controllers: [
    StripeWebhookController,
    RetellWebhookController,
    CalcomWebhookController,
    AdminProcessedWebhookEventsController,
  ],
  providers: [WebhooksService, WebhookProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { QUEUE_NAMES } from './queue.constants';
import { WebhooksService } from '../webhooks/webhooks.service';
import type { WebhookJobPayload } from './webhook-queue.service';
import { RetellWebhookDto } from '../webhooks/dto/retell-webhook.dto';

@Processor(QUEUE_NAMES.WEBHOOKS, {
  concurrency: 2,
})
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job<WebhookJobPayload>): Promise<void> {
    const { source, eventId, eventType, payload } = job.data;
    this.logger.log(`Processing webhook job: ${source} ${eventType} (${eventId})`);

    const isDuplicate = await this.webhooksService.isDuplicateEvent(eventId, source, eventType);
    if (isDuplicate) {
      this.logger.debug(`Duplicate skipped: ${eventId}`);
      return;
    }

    if (source === 'retell') {
      const body = payload as unknown as RetellWebhookDto;
      switch (eventType) {
        case 'call_started':
          await this.webhooksService.handleRetellCallStarted(body);
          break;
        case 'call_ended':
          await this.webhooksService.handleRetellCallEnded(body);
          break;
        case 'call_analyzed':
          await this.webhooksService.handleRetellCallAnalyzed(body);
          break;
        case 'alert_triggered':
          await this.webhooksService.handleRetellAlertTriggered(body);
          break;
        default:
          this.logger.log(`Unhandled Retell event: ${eventType}`);
      }
    } else if (source === 'stripe') {
      const data = payload as Record<string, unknown>;
      switch (eventType) {
        case 'invoice.payment_succeeded':
          await this.webhooksService.handleInvoicePaid(data);
          break;
        case 'invoice.payment_failed':
          await this.webhooksService.handleInvoiceFailed(data);
          break;
        case 'customer.subscription.deleted':
          await this.webhooksService.handleSubscriptionDeleted(data);
          break;
        default:
          this.logger.log(`Unhandled Stripe event: ${eventType}`);
      }
    } else {
      this.logger.warn(`Unknown webhook source: ${source}`);
    }

    await this.webhooksService.recordProcessedEvent(eventId, source, eventType);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<WebhookJobPayload> | undefined, error: Error): void {
    const payload = job?.data;
    const eventId = payload?.eventId ?? 'unknown';
    const source = payload?.source ?? 'unknown';
    const eventType = payload?.eventType ?? 'unknown';
    this.logger.error(
      `Webhook job failed (DLQ): ${source} ${eventType} (${eventId}) — ${error.message}`,
    );
    Sentry.captureException(error, {
      extra: { eventId, source, eventType, jobId: job?.id },
    });
  }
}

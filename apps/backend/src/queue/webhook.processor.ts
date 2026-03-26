import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { QUEUE_NAMES } from './queue.constants';
import { WebhooksService } from '../webhooks/webhooks.service';
import type { WebhookJobPayload } from './webhook-queue.service';
import { RetellWebhookDto } from '../webhooks/dto/retell-webhook.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Processor(QUEUE_NAMES.WEBHOOKS, {
  concurrency: 2,
})
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private webhooksService: WebhooksService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobPayload>): Promise<void> {
    const { source, eventId, eventType, payload } = job.data;
    this.logger.log(
      `Processing webhook job: ${source} ${eventType} (${eventId})`,
    );

    const shouldProcess = await this.webhooksService.claimProcessedEvent(
      eventId,
      source,
      eventType,
    );
    if (!shouldProcess) {
      this.logger.debug(`Duplicate skipped: ${eventId}`);
      return;
    }

    try {
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
        const data = payload;
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

      // Claim is retained after successful processing for dedupe.
    } catch (error) {
      await this.webhooksService.releaseProcessedEvent(eventId, source);
      throw error;
    }
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
    this.notificationsService
      .createForAdmins({
        type: 'webhook_job_failed',
        source: String(source),
        severity: 'important',
        title: 'Webhook processing failed',
        message: `${String(source)} webhook processing failed after retries`,
        metadata: {
          eventId,
          eventType,
          jobId: job?.id ?? null,
          error: error.message,
        },
      })
      .catch((notifyErr: unknown) => {
        this.logger.error(
          `Failed to notify admins about webhook job failure: ${
            notifyErr instanceof Error ? notifyErr.message : String(notifyErr)
          }`,
        );
      });
  }
}

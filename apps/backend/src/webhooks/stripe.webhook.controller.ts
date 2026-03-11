import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { WebhooksService } from './webhooks.service';
import { WebhookQueueService } from '../queue/webhook-queue.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;
  private webhookSecret: string;
  private webhookSecretLegacy: string;

  constructor(
    private webhooksService: WebhooksService,
    private webhookQueue: WebhookQueueService,
    private metrics: MetricsService,
    config: ConfigService,
  ) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY', '');
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET', '').trim();
    this.webhookSecretLegacy = config
      .get<string>('STRIPE_WEBHOOK_SECRET_LEGACY', '')
      .trim();
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  }

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.webhookSecret && !this.webhookSecretLegacy) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event | undefined;
    const secrets = [this.webhookSecret, this.webhookSecretLegacy].filter(Boolean);
    let lastError: Error | null = null;

    for (const secret of secrets) {
      if (!secret) continue;
      try {
        event = this.stripe.webhooks.constructEvent(
          req.body,
          signature,
          secret,
        );
        if (secret === this.webhookSecretLegacy) {
          this.logger.log('Stripe webhook verified with legacy secret (rotation in progress)');
        }
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!event) {
      const message = lastError instanceof Error ? lastError.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid signature');
    }

    this.metrics.recordWebhookReceived('stripe');
    const isDuplicate = await this.webhooksService.isDuplicateEvent(
      event.id,
      'stripe',
      event.type,
    );
    if (isDuplicate) {
      return { received: true, duplicate: true };
    }

    if (this.webhookQueue.isEnabled()) {
      const data = event.data.object as unknown as Record<string, unknown>;
      const jobId = await this.webhookQueue.add({
        source: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: data,
      });
      if (jobId) {
        res.status(HttpStatus.ACCEPTED);
        return { received: true, queued: true };
      }
    }

    this.logger.log(`Stripe event received: ${event.type}`);

    const data = event.data.object as unknown as Record<string, unknown>;

    switch (event.type) {
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
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    await this.webhooksService.recordProcessedEvent(event.id, 'stripe', event.type);
    return { received: true };
  }
}

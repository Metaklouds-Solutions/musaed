import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  BadRequestException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { WebhookQueueService } from '../queue/webhook-queue.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;
  private webhookSecret: string;
  private webhookSecretLegacy: string;

  constructor(
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
    const secrets = [this.webhookSecret, this.webhookSecretLegacy].filter(
      Boolean,
    );
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
          this.logger.log(
            'Stripe webhook verified with legacy secret (rotation in progress)',
          );
        }
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!event) {
      const message =
        lastError instanceof Error ? lastError.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid signature');
    }

    this.metrics.recordWebhookReceived('stripe');

    const data = event.data.object as unknown as Record<string, unknown>;
    await this.enqueueOrThrow({
      source: 'stripe',
      eventId: event.id,
      eventType: event.type,
      payload: data,
    });

    res.status(HttpStatus.ACCEPTED);
    return { received: true, queued: true };
  }

  private async enqueueOrThrow(payload: {
    source: 'stripe';
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<string> {
    if (!this.webhookQueue.isEnabled()) {
      throw new ServiceUnavailableException(
        'Stripe webhook queue is unavailable or disabled',
      );
    }

    try {
      const jobId = await this.webhookQueue.add(payload);
      if (!jobId) {
        throw new ServiceUnavailableException(
          'Stripe webhook queue is unavailable or disabled',
        );
      }
      return jobId;
    } catch (error) {
      this.logger.error(
        'Stripe webhook enqueue failed',
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Stripe webhook queue is unavailable or disabled',
      );
    }
  }
}

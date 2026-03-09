import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private webhooksService: WebhooksService,
    config: ConfigService,
  ) {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY', '');
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        this.webhookSecret,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid signature');
    }

    const isDuplicate = await this.webhooksService.isDuplicateEvent(
      event.id,
      'stripe',
      event.type,
    );
    if (isDuplicate) {
      return { received: true, duplicate: true };
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

    return { received: true };
  }
}

import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Headers,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { BookingsService } from '../bookings/bookings.service';
import { WebhooksService } from './webhooks.service';
import { MetricsService } from '../metrics/metrics.service';

function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

@Controller('webhooks/calcom')
export class CalcomWebhookController {
  private readonly logger = new Logger(CalcomWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly webhooksService: WebhooksService,
    private readonly metrics: MetricsService,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('CALCOM_WEBHOOK_SECRET', '').trim();
  }

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-cal-signature-256') signature256?: string,
    @Headers('x-cal-signature') signature?: string,
    @Headers('x-cal-webhook-signature') altSignature?: string,
  ) {
    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);

    if (!this.webhookSecret) {
      this.logger.warn(
        'CALCOM_WEBHOOK_SECRET not configured — skipping signature verification',
      );
    } else {
      const incoming = (signature256 ?? signature ?? altSignature ?? '').trim();
      if (!incoming) {
        throw new ForbiddenException('Missing Cal.com webhook signature');
      }

      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');
      const normalizedIncoming = incoming.startsWith('sha256=')
        ? incoming.slice('sha256='.length)
        : incoming;

      if (!timingSafeEqual(normalizedIncoming, expected)) {
        throw new ForbiddenException('Invalid Cal.com webhook signature');
      }
    }

    let payload: unknown;
    try {
      payload = req.body instanceof Buffer ? JSON.parse(rawBody) : req.body;
    } catch {
      throw new BadRequestException('Invalid Cal.com webhook payload');
    }
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid Cal.com webhook payload');
    }

    const eventType =
      this.readString((payload as Record<string, unknown>).triggerEvent) ??
      this.readString((payload as Record<string, unknown>).eventType) ??
      this.readString((payload as Record<string, unknown>).event) ??
      'unknown';

    const eventId =
      this.readString((payload as Record<string, unknown>).id) ??
      this.readString((payload as Record<string, unknown>).uid) ??
      crypto.createHash('sha1').update(rawBody).digest('hex');

    this.metrics.recordWebhookReceived('calcom');
    const isDuplicate = await this.webhooksService.isDuplicateEvent(
      eventId,
      'calcom',
      eventType,
    );
    if (isDuplicate) return { received: true, duplicate: true };

    const result = await this.bookingsService.upsertFromCalcomWebhook(
      payload as Record<string, unknown>,
    );

    await this.webhooksService.recordProcessedEvent(
      eventId,
      'calcom',
      eventType,
    );
    return { received: true, synced: result.processed ?? false, ...result };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }
}

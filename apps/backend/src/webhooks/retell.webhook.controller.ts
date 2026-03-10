import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { RetellWebhookDto } from './dto/retell-webhook.dto';

/** Maximum age of webhook timestamp in seconds (0 = disabled). */
const DEFAULT_TIMESTAMP_MAX_AGE_SEC = 0;

/**
 * Constant-time comparison of two hex strings.
 * Prevents timing attacks on webhook signature verification.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

@Controller('webhooks/retell')
export class RetellWebhookController {
  private readonly logger = new Logger(RetellWebhookController.name);
  private readonly webhookSecret: string;
  private readonly webhookSecretLegacy: string;
  private readonly requireSignature: boolean;
  private readonly timestampMaxAgeSec: number;

  constructor(
    private webhooksService: WebhooksService,
    config: ConfigService,
  ) {
    const nodeEnv = config.get<string>('NODE_ENV', 'development');
    this.requireSignature = nodeEnv !== 'development';
    this.webhookSecret = config.get<string>('RETELL_WEBHOOK_SECRET', '').trim();
    this.webhookSecretLegacy = config.get<string>('RETELL_WEBHOOK_SECRET_LEGACY', '').trim();
    const tsMax = config.get<string>('WEBHOOK_TIMESTAMP_MAX_AGE_SEC');
    this.timestampMaxAgeSec = tsMax ? parseInt(tsMax, 10) : DEFAULT_TIMESTAMP_MAX_AGE_SEC;
    if (!Number.isFinite(this.timestampMaxAgeSec) || this.timestampMaxAgeSec < 0) {
      this.timestampMaxAgeSec = DEFAULT_TIMESTAMP_MAX_AGE_SEC;
    }
    if (this.requireSignature && this.webhookSecret.length === 0) {
      throw new Error(
        'RETELL_WEBHOOK_SECRET must be set when webhook signature verification is required',
      );
    }
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-retell-signature') signature?: string,
    @Headers('x-retell-timestamp') timestampHeader?: string,
  ) {
    if (this.webhookSecret) {
      if (!signature) {
        throw new ForbiddenException('Missing webhook signature');
      }

      if (this.timestampMaxAgeSec > 0 && timestampHeader) {
        const ts = parseInt(timestampHeader, 10);
        if (!Number.isFinite(ts)) {
          throw new ForbiddenException('Invalid webhook timestamp');
        }
        const ageSec = Math.floor(Date.now() / 1000) - ts;
        if (ageSec < 0 || ageSec > this.timestampMaxAgeSec) {
          this.logger.warn(`Retell webhook rejected: timestamp outside allowed window (age=${ageSec}s)`);
          throw new ForbiddenException('Webhook timestamp expired or invalid');
        }
      }

      const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      let valid = timingSafeEqualHex(signature, expected);
      if (!valid && this.webhookSecretLegacy.length > 0) {
        const expectedLegacy = crypto
          .createHmac('sha256', this.webhookSecretLegacy)
          .update(rawBody)
          .digest('hex');
        valid = timingSafeEqualHex(signature, expectedLegacy);
        if (valid) {
          this.logger.log('Retell webhook verified with legacy secret (rotation in progress)');
        }
      }

      if (!valid) {
        this.logger.error('Retell webhook signature verification failed');
        throw new ForbiddenException('Invalid webhook signature');
      }
    } else if (this.requireSignature) {
      throw new ForbiddenException('Webhook signature secret is required');
    } else {
      this.logger.warn(
        'RETELL_WEBHOOK_SECRET not configured — skipping signature verification',
      );
    }

    let body: RetellWebhookDto;
    try {
      body = req.body instanceof Buffer ? JSON.parse(req.body.toString('utf8')) : req.body;
    } catch (error) {
      throw new BadRequestException('Invalid JSON payload');
    }

    const eventType = body.event;
    const eventId = this.webhooksService.getRetellEventId(body);
    const isDuplicate = await this.webhooksService.isDuplicateEvent(
      eventId,
      'retell',
      eventType,
    );
    if (isDuplicate) {
      return { received: true, duplicate: true };
    }

    this.logger.log(`Retell event received: ${eventType}`);

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

    return { received: true };
  }
}

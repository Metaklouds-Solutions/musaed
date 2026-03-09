import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhooksService } from './webhooks.service';
import { RetellWebhookDto } from './dto/retell-webhook.dto';

@Controller('webhooks/retell')
export class RetellWebhookController {
  private readonly logger = new Logger(RetellWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private webhooksService: WebhooksService,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('RETELL_WEBHOOK_SECRET', '');
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() body: RetellWebhookDto,
    @Headers('x-retell-signature') signature?: string,
  ) {
    if (this.webhookSecret) {
      if (!signature) {
        throw new ForbiddenException('Missing webhook signature');
      }
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');
      if (signature !== expected) {
        this.logger.error('Retell webhook signature verification failed');
        throw new ForbiddenException('Invalid webhook signature');
      }
    } else {
      this.logger.warn(
        'RETELL_WEBHOOK_SECRET not configured — skipping signature verification',
      );
    }

    const eventType = body.event;
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

      default:
        this.logger.log(`Unhandled Retell event: ${eventType}`);
    }

    return { received: true };
  }
}

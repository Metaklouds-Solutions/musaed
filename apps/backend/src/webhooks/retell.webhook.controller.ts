import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks/retell')
export class RetellWebhookController {
  private readonly logger = new Logger(RetellWebhookController.name);

  constructor(private webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
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

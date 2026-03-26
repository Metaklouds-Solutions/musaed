import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { WebhooksService } from './webhooks.service';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Admin API for observability of processed inbound webhooks (Stripe, Retell, Cal.com).
 */
@Controller('admin/webhooks')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminProcessedWebhookEventsController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Paginated list of processed webhook events stored for idempotency.
   */
  @Get('processed-events')
  async listProcessedEvents(
    @Query('limit') limitStr?: string,
    @Query('skip') skipStr?: string,
  ) {
    const parsedLimit = parseInt(limitStr ?? String(DEFAULT_LIMIT), 10);
    const parsedSkip = parseInt(skipStr ?? '0', 10);
    const limit = Number.isNaN(parsedLimit)
      ? DEFAULT_LIMIT
      : Math.min(MAX_LIMIT, Math.max(1, parsedLimit));
    const skip = Number.isNaN(parsedSkip) ? 0 : Math.max(0, parsedSkip);
    return this.webhooksService.listProcessedEvents(limit, skip);
  }
}

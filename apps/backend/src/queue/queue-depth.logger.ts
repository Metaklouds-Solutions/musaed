import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookQueueService } from './webhook-queue.service';
import { EmailQueueService } from '../email/email.queue.service';
import { NotificationsQueueService } from '../notifications/notifications.queue.service';

@Injectable()
export class QueueDepthLogger {
  private readonly logger = new Logger(QueueDepthLogger.name);

  constructor(
    private config: ConfigService,
    private webhookQueue: WebhookQueueService,
    private emailQueue: EmailQueueService,
    private notificationsQueue: NotificationsQueueService,
  ) {}

  /** Logs queue depths every 5 minutes when enabled. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async logQueueDepths(): Promise<void> {
    const enabled =
      this.config.get<string>('QUEUE_DEPTH_LOGGING_ENABLED', 'false') ===
      'true';
    if (!enabled) return;

    const [webhooks, email, notifications] = await Promise.all([
      this.webhookQueue.getQueueDepth(),
      this.emailQueue.getQueueDepth(),
      this.notificationsQueue.getQueueDepth(),
    ]);

    this.logger.log({
      event: 'queue_depth',
      webhooks,
      email,
      notifications,
    });
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { NotificationsService } from '../notifications.service';
import type { NotificationFanoutPayload } from '../notifications.queue.service';

@Processor(QUEUE_NAMES.NOTIFICATIONS, {
  concurrency: 2,
})
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationFanoutPayload>): Promise<void> {
    const { userIds, tenantId, type, title, message, link, meta, priority } =
      job.data;

    this.logger.log(
      `Processing notification fanout: ${type} to ${userIds.length} users (attempt ${job.attemptsMade + 1})`,
    );

    try {
      const uniqueIds = [...new Set(userIds)];
      for (const userId of uniqueIds) {
        await this.notificationsService.createFromQueue({
          userId,
          tenantId,
          type,
          title,
          message,
          link,
          meta,
          priority,
        });
      }
      this.logger.debug({
        event: 'notification_fanout_completed',
        type,
        userCount: uniqueIds.length,
      });
    } catch (err) {
      this.logger.error({
        event: 'notification_fanout_failed',
        type,
        userCount: userIds.length,
        attempt: job.attemptsMade + 1,
        error: err instanceof Error ? err.message : String(err),
      });

      if (err instanceof Error) {
        Sentry.captureException(err, {
          extra: {
            jobId: job.id,
            type,
            userCount: userIds.length,
            attempt: job.attemptsMade + 1,
          },
        });
      }

      throw err;
    }
  }
}

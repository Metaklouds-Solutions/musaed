import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
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
    const {
      userIds,
      tenantId,
      type,
      source,
      severity,
      title,
      message,
      link,
      meta,
      metadata,
      priority,
    } = job.data;

    this.logger.log(
      `Processing notification fanout: ${type} to ${userIds.length} users (attempt ${job.attemptsMade + 1})`,
    );

    try {
      const uniqueIds = [...new Set(userIds)];
      const insertedCount =
        await this.notificationsService.createBatchFromQueue(uniqueIds, {
          tenantId,
          type,
          source,
          severity,
          title,
          message,
          link,
          meta,
          metadata,
          priority,
        });
      this.logger.debug({
        event: 'notification_fanout_completed',
        type,
        userCount: uniqueIds.length,
        insertedCount,
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

  @OnWorkerEvent('failed')
  onFailed(
    job: Job<NotificationFanoutPayload> | undefined,
    error: Error,
  ): void {
    const type = job?.data?.type ?? 'unknown';
    const userCount = job?.data?.userIds?.length ?? 0;
    this.logger.error(
      `Notification fanout job failed (DLQ): type=${type} users=${userCount} — ${error.message}`,
    );
    Sentry.captureException(error, {
      extra: {
        jobId: job?.id,
        type,
        userCount,
        queue: QUEUE_NAMES.NOTIFICATIONS,
      },
    });
  }
}

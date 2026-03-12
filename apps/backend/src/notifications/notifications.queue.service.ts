import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from '../queue/queue.constants';
import { getRedisConnectionOptions } from '../queue/queue.config';

export interface NotificationFanoutPayload {
  userIds: string[];
  tenantId: string | null;
  type: string;
  source?: string;
  severity?: 'critical' | 'important' | 'normal' | 'info';
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  priority?: string;
}

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);
  private queue: Queue<NotificationFanoutPayload> | null = null;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    const enabled =
      this.config.get<string>('QUEUE_NOTIFICATIONS_ENABLED', 'false') === 'true';
    if (redisUrl && enabled) {
      this.queue = new Queue<NotificationFanoutPayload>(QUEUE_NAMES.NOTIFICATIONS, {
        connection: getRedisConnectionOptions(redisUrl),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.logger.log('Notifications queue enabled');
    } else {
      this.logger.debug(
        'Notifications queue disabled (REDIS_URL or QUEUE_NOTIFICATIONS_ENABLED)',
      );
    }
  }

  isEnabled(): boolean {
    return this.queue !== null;
  }

  /**
   * Enqueues a notification fanout job.
   *
   * @param payload - Fanout payload (userIds + notification data)
   * @returns Job ID or null if queue disabled
   */
  async enqueueFanout(payload: NotificationFanoutPayload): Promise<string | null> {
    if (!this.queue) return null;
    const sortedIds = [...payload.userIds].sort().join(',');
    const contentHash = crypto
      .createHash('sha256')
      .update(`${payload.type}:${payload.title}:${sortedIds}`)
      .digest('hex')
      .slice(0, 12);
    const jobId = `fanout:${payload.type}:${contentHash}`;
    try {
      const job = await this.queue.add('fanout', payload, {
        jobId,
        ...DEFAULT_JOB_OPTIONS,
      });
      return job.id ?? null;
    } catch (err) {
      this.logger.error(
        `Failed to enqueue notification fanout: ${payload.type}`,
        err instanceof Error ? err.stack : err,
      );
      const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        throw err;
      }
      return null;
    }
  }

  /** Returns approximate queue depth for monitoring. */
  async getQueueDepth(): Promise<number> {
    if (!this.queue) return 0;
    try {
      const waiting = await this.queue.getWaitingCount();
      const delayed = await this.queue.getDelayedCount();
      return waiting + delayed;
    } catch (err) {
      this.logger.warn(
        'Failed to get notifications queue depth',
        err instanceof Error ? err.message : String(err),
      );
      return -1;
    }
  }
}

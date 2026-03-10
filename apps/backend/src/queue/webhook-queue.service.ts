import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, JobsOptions } from 'bullmq';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from './queue.constants';
import { getRedisConnectionOptions } from './queue.config';

export interface WebhookJobPayload {
  source: 'retell' | 'stripe';
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class WebhookQueueService {
  private readonly logger = new Logger(WebhookQueueService.name);
  private queue: Queue<WebhookJobPayload> | null = null;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    const enabled = this.config.get<string>('QUEUE_WEBHOOKS_ENABLED', 'false') === 'true';
    if (redisUrl && enabled) {
      this.queue = new Queue<WebhookJobPayload>(QUEUE_NAMES.WEBHOOKS, {
        connection: getRedisConnectionOptions(redisUrl),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.logger.log('Webhook queue enabled');
    } else {
      this.logger.debug('Webhook queue disabled (REDIS_URL or QUEUE_WEBHOOKS_ENABLED)');
    }
  }

  isEnabled(): boolean {
    return this.queue !== null;
  }

  /** Returns approximate queue depth (waiting + delayed) for monitoring. */
  async getQueueDepth(): Promise<number> {
    if (!this.queue) return 0;
    try {
      const waiting = await this.queue.getWaitingCount();
      const delayed = await this.queue.getDelayedCount();
      return waiting + delayed;
    } catch (err) {
      this.logger.warn(
        'Failed to get webhook queue depth',
        err instanceof Error ? err.message : String(err),
      );
      return -1;
    }
  }

  async add(payload: WebhookJobPayload): Promise<string | null> {
    if (!this.queue) return null;
    try {
      const job = await this.queue.add('process', payload, {
        jobId: payload.eventId,
        ...DEFAULT_JOB_OPTIONS,
      });
      return job.id ?? null;
    } catch (err) {
      this.logger.error(`Failed to enqueue webhook: ${payload.eventId}`, err instanceof Error ? err.stack : err);
      const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        throw err;
      }
      return null;
    }
  }
}

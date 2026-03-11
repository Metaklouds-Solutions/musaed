import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from '../queue/queue.constants';
import { getRedisConnectionOptions } from '../queue/queue.config';

/** Email job types. */
export type EmailJobType = 'invite' | 'password_reset' | 'appointment_reminder';

/** Payloads per email type. */
export type EmailJobPayloadMap = {
  invite: { to: string; name: string; token: string };
  password_reset: { to: string; name: string; token: string };
  appointment_reminder: {
    to: string;
    customerName: string;
    appointmentDate: string;
    timeSlot: string;
  };
};

export type EmailJobPayload = {
  [K in EmailJobType]: { type: K; payload: EmailJobPayloadMap[K] };
}[EmailJobType];

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private queue: Queue<EmailJobPayload> | null = null;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    const enabled = this.config.get<string>('QUEUE_EMAIL_ENABLED', 'false') === 'true';
    if (redisUrl && enabled) {
      this.queue = new Queue<EmailJobPayload>(QUEUE_NAMES.EMAIL, {
        connection: getRedisConnectionOptions(redisUrl),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.logger.log('Email queue enabled');
    } else {
      this.logger.debug('Email queue disabled (REDIS_URL or QUEUE_EMAIL_ENABLED)');
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
        'Failed to get email queue depth',
        err instanceof Error ? err.message : String(err),
      );
      return -1;
    }
  }

  /**
   * Adds an email job to the queue.
   *
   * @param type - Email type (invite, password_reset, appointment_reminder)
   * @param payload - Type-specific payload
   * @returns Job ID or null if queue disabled or enqueue failed
   */
  async enqueueEmail<T extends EmailJobType>(
    type: T,
    payload: EmailJobPayloadMap[T],
  ): Promise<string | null> {
    if (!this.queue) return null;
    const jobPayload = { type, payload } as EmailJobPayload;
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 12);
    const jobId = `email:${type}:${payload.to}:${contentHash}`;
    try {
      const job = await this.queue.add(type, jobPayload, {
        jobId,
        ...DEFAULT_JOB_OPTIONS,
      });
      return job.id ?? null;
    } catch (err) {
      this.logger.error(
        `Failed to enqueue email: ${type} to ${payload.to}`,
        err instanceof Error ? err.stack : err,
      );
      const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        throw err;
      }
      return null;
    }
  }
}

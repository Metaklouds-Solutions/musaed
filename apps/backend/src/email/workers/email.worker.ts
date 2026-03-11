import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { EmailService } from '../email.service';
import type { EmailJobPayload } from '../email.queue.service';
import { MetricsService } from '../../metrics/metrics.service';

@Processor(QUEUE_NAMES.EMAIL, {
  concurrency: 3,
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private emailService: EmailService,
    private metrics: MetricsService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    const { type, payload } = job.data;
    this.logger.log(`Processing email job: ${type} to ${payload.to} (attempt ${job.attemptsMade + 1})`);

    try {
      await this.emailService.sendInternalFromJob(type, payload);
      this.metrics.recordEmailSent(type);
      this.logger.log({ event: 'email_sent', type, to: payload.to, jobId: job.id });
    } catch (err) {
      this.metrics.recordEmailFailed(type);
      const isRetry = job.attemptsMade < (job.opts.attempts ?? 3) - 1;
      this.logger.error({
        event: isRetry ? 'email_retry' : 'email_failed',
        type,
        to: payload.to,
        attempt: job.attemptsMade + 1,
        error: err instanceof Error ? err.message : String(err),
      });

      if (err instanceof Error) {
        Sentry.captureException(err, {
          extra: { jobId: job.id, type, to: payload.to, attempt: job.attemptsMade + 1 },
        });
      }

      throw err;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobPayload> | undefined, error: Error): void {
    const type = job?.data?.type ?? 'unknown';
    const to = job?.data?.payload?.to ?? 'unknown';
    this.logger.error(`Email job failed (DLQ): ${type} to ${to} — ${error.message}`);
    Sentry.captureException(error, {
      extra: { jobId: job?.id, type, to, queue: QUEUE_NAMES.EMAIL },
    });
  }
}

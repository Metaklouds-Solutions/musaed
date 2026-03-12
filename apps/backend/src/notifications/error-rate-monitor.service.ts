import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ErrorRateMonitorService {
  private readonly logger = new Logger(ErrorRateMonitorService.name);
  private readonly errorTimestamps: number[] = [];
  private readonly windowMs = 60_000;
  private readonly threshold = 25;
  private lastNotifiedAt = 0;

  constructor(private readonly notificationsService: NotificationsService) {}

  recordServerError(): void {
    const now = Date.now();
    this.errorTimestamps.push(now);
    this.prune(now);
  }

  @Cron('*/30 * * * * *')
  async checkErrorSpike(): Promise<void> {
    const now = Date.now();
    this.prune(now);
    const count = this.errorTimestamps.length;
    const cooldownMs = 5 * 60_000;
    if (count < this.threshold || now - this.lastNotifiedAt < cooldownMs) {
      return;
    }

    this.lastNotifiedAt = now;
    this.logger.warn(`High error rate detected: ${count} server errors in last minute`);
    await this.notificationsService.createForAdmins({
      type: 'high_error_rate',
      source: 'logs',
      severity: 'important',
      title: 'High error rate detected',
      message: `${count} server errors in the last minute.`,
      metadata: { windowSeconds: 60, count, threshold: this.threshold },
      priority: 'high',
    });
  }

  private prune(now: number): void {
    const min = now - this.windowMs;
    while (this.errorTimestamps.length > 0 && this.errorTimestamps[0] < min) {
      this.errorTimestamps.shift();
    }
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationRetentionService {
  private readonly logger = new Logger(NotificationRetentionService.name);
  private static readonly RETENTION_DAYS = 90;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  @Cron('0 20 * * * *')
  async cleanupOldNotifications(): Promise<void> {
    const before = new Date(Date.now() - NotificationRetentionService.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.notificationModel.deleteMany({
      createdAt: { $lt: before },
    });
    const deleted = result.deletedCount ?? 0;
    if (deleted > 0) {
      this.logger.log(`Deleted ${deleted} old notifications (retention=${NotificationRetentionService.RETENTION_DAYS} days)`);
    }
  }
}


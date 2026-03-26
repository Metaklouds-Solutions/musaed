import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  TenantStaff,
  TenantStaffSchema,
} from '../tenants/schemas/tenant-staff.schema';
import { QueueModule } from '../queue/queue.module';
import { NotificationsProcessor } from './workers/notifications.worker';
import { ErrorRateMonitorService } from './error-rate-monitor.service';
import { NotificationRetentionService } from './notification-retention.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: TenantStaff.name, schema: TenantStaffSchema },
    ]),
    QueueModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '8h') },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsProcessor,
    ErrorRateMonitorService,
    NotificationRetentionService,
  ],
  exports: [NotificationsService, ErrorRateMonitorService],
})
export class NotificationsModule {}

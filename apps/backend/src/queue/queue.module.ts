import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './queue.constants';
import { getRedisConnectionOptions } from './queue.config';
import { WebhookQueueService } from './webhook-queue.service';
import { EmailQueueService } from '../email/email.queue.service';
import { NotificationsQueueService } from '../notifications/notifications.queue.service';
import { QueueDepthLogger } from './queue-depth.logger';

@Global()
@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const redisUrl = config.get<string>('REDIS_URL');
            const nodeEnv = config.get<string>('NODE_ENV', 'development');
            if (!redisUrl) {
              if (nodeEnv === 'production') {
                throw new Error(
                  'REDIS_URL must be set in production for BullMQ queues. Set REDIS_URL or disable queue features.',
                );
              }
              return { connection: { host: 'localhost', port: 6379 } };
            }
            return { connection: getRedisConnectionOptions(redisUrl) };
          },
        }),
        BullModule.registerQueue(
          { name: QUEUE_NAMES.WEBHOOKS },
          { name: QUEUE_NAMES.EMAIL },
          { name: QUEUE_NAMES.NOTIFICATIONS },
        ),
      ],
      providers: [
        WebhookQueueService,
        EmailQueueService,
        NotificationsQueueService,
        QueueDepthLogger,
      ],
      exports: [
        WebhookQueueService,
        EmailQueueService,
        NotificationsQueueService,
        BullModule,
      ],
    };
  }
}

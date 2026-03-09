import { Module, Logger, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { Connection } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { StaffModule } from './staff/staff.module';
import { AgentTemplatesModule } from './agent-templates/agent-templates.module';
import { AgentInstancesModule } from './agent-instances/agent-instances.module';
import { BillingModule } from './billing/billing.module';
import { CustomersModule } from './customers/customers.module';
import { BookingsModule } from './bookings/bookings.module';
import { SupportModule } from './support/support.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mongoUri = config.getOrThrow<string>('MONGODB_URI');
        return {
          uri: mongoUri,
          serverSelectionTimeoutMS: 10_000,
          socketTimeoutMS: 45_000,
          retryWrites: true,
          w: 'majority',
          directConnection: false,
          family: 4,
          appName: 'mosaed',
          connectionFactory: (connection: Connection) => {
            const log = () => {
              new Logger('MongoDB').log('Database connected successfully');
            };
            if (connection.readyState === 1) {
              log();
            } else {
              connection.once('connected', log);
            }
            connection.on('error', (err: Error) => {
              new Logger('MongoDB').error(`Connection error: ${err.message}`);
            });
            return connection;
          },
        };
      },
    }),
    HealthModule,
    EmailModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    SubscriptionPlansModule,
    StaffModule,
    AgentTemplatesModule,
    AgentInstancesModule,
    BillingModule,
    CustomersModule,
    BookingsModule,
    SupportModule,
    DashboardModule,
    ReportsModule,
    AdminModule,
    SettingsModule,
    WebhooksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

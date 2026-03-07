import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
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
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    HealthModule,
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
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '../subscription-plans/schemas/subscription-plan.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import {
  BillingAdminController,
  BillingTenantController,
} from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [BillingAdminController, BillingTenantController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
} from '../subscription-plans/schemas/subscription-plan.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
  ) {}

  async getPlans() {
    return this.planModel
      .find({ isActive: true })
      .sort({ monthlyPriceCents: 1 });
  }

  async getAllPlans() {
    return this.planModel.find().sort({ monthlyPriceCents: 1 });
  }

  async getPlanById(id: string) {
    const plan = await this.planModel.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    return this.planModel.create(dto);
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.planModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getOverview() {
    const [plans, tenantsByPlan, totalTenants] = await Promise.all([
      this.planModel.find({ isActive: true }),
      this.tenantModel.aggregate([
        {
          $match: {
            deletedAt: null,
            status: { $in: ['ACTIVE', 'TRIAL'] },
            planId: { $ne: null },
          },
        },
        { $group: { _id: '$planId', count: { $sum: 1 } } },
      ]),
      this.tenantModel.countDocuments({
        deletedAt: null,
        status: { $in: ['ACTIVE', 'TRIAL'] },
      }),
    ]);

    const countByPlan = new Map<string, number>();
    for (const row of tenantsByPlan) {
      countByPlan.set(row._id.toString(), row.count);
    }

    let totalMrrCents = 0;
    const planSummaries = plans.map((p) => {
      const subscriberCount = countByPlan.get(p._id.toString()) || 0;
      totalMrrCents += p.monthlyPriceCents * subscriberCount;
      return {
        id: p._id,
        name: p.name,
        monthlyPriceCents: p.monthlyPriceCents,
        subscriberCount,
      };
    });

    return { totalTenants, totalMrrCents, plans: planSummaries };
  }

  async getTenantBilling(tenantId: string) {
    const tenant = await this.tenantModel
      .findOne({ _id: tenantId, deletedAt: null })
      .populate('planId');

    if (!tenant) throw new NotFoundException('Tenant not found');

    return {
      tenantId: tenant._id,
      plan: tenant.planId,
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
      status: tenant.status,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(AgentInstance.name) private agentModel: Model<AgentInstanceDocument>,
  ) {}

  // ─── Stripe ────────────────────────────────────────────────

  async handleInvoicePaid(invoice: any) {
    const customerId = invoice.customer;
    const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
    if (!tenant) {
      this.logger.warn(`No tenant found for Stripe customer ${customerId}`);
      return;
    }

    if (tenant.status === 'SUSPENDED') {
      tenant.status = 'ACTIVE';
      await tenant.save();
      this.logger.log(`Tenant ${tenant.slug} reactivated after payment`);
    }
  }

  async handleInvoiceFailed(invoice: any) {
    const customerId = invoice.customer;
    const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
    if (!tenant) {
      this.logger.warn(`No tenant found for Stripe customer ${customerId}`);
      return;
    }

    tenant.status = 'SUSPENDED';
    await tenant.save();
    this.logger.warn(`Tenant ${tenant.slug} suspended due to payment failure`);
  }

  async handleSubscriptionDeleted(subscription: any) {
    const customerId = subscription.customer;
    const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
    if (!tenant) {
      this.logger.warn(`No tenant found for Stripe customer ${customerId}`);
      return;
    }

    tenant.status = 'CHURNED';
    tenant.stripeSubscriptionId = null;
    tenant.planId = null;
    await tenant.save();
    this.logger.log(`Tenant ${tenant.slug} churned — subscription deleted`);
  }

  // ─── Retell AI ─────────────────────────────────────────────

  async handleRetellCallStarted(payload: any) {
    const { call_id, agent_id } = payload;
    this.logger.log(`Retell call started: ${call_id} for agent ${agent_id}`);
    // Future: update agent instance live status, record call start
  }

  async handleRetellCallEnded(payload: any) {
    const { call_id, agent_id, duration_ms } = payload;
    this.logger.log(`Retell call ended: ${call_id} (${duration_ms}ms)`);
    // Future: persist call record, update usage counters
  }

  async handleRetellCallAnalyzed(payload: any) {
    const { call_id, summary, sentiment } = payload;
    this.logger.log(`Retell call analyzed: ${call_id} — sentiment: ${sentiment}`);
    // Future: store analysis results, trigger follow-up actions
  }
}

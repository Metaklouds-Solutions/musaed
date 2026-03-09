import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { ProcessedEvent, ProcessedEventDocument } from './schemas/processed-event.schema';
import { RetellWebhookDto } from './dto/retell-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(AgentInstance.name) private agentModel: Model<AgentInstanceDocument>,
    @InjectModel(ProcessedEvent.name) private processedEventModel: Model<ProcessedEventDocument>,
  ) {}

  /**
   * Returns true if the event was already processed (duplicate).
   * Returns false and records the event if it's new.
   */
  async isDuplicateEvent(eventId: string, source: string, eventType: string): Promise<boolean> {
    try {
      await this.processedEventModel.create({ eventId, source, eventType });
      return false;
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as Record<string, unknown>).code === 11000) {
        this.logger.warn(`Duplicate ${source} event skipped: ${eventId}`);
        return true;
      }
      throw err;
    }
  }

  // ─── Stripe ────────────────────────────────────────────────

  async handleInvoicePaid(invoice: Record<string, unknown>) {
    const customerId = invoice.customer as string;
    const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
    if (!tenant) {
      this.logger.warn(`No tenant found for Stripe customer ${customerId}`);
      return;
    }

    const reactivatableStatuses = ['SUSPENDED', 'TRIAL'];
    if (reactivatableStatuses.includes(tenant.status)) {
      const oldStatus = tenant.status;
      tenant.status = 'ACTIVE';
      await tenant.save();
      this.logger.log(`Tenant ${tenant.slug} transitioned ${oldStatus} → ACTIVE after payment`);
    }
  }

  async handleInvoiceFailed(invoice: Record<string, unknown>) {
    const customerId = invoice.customer as string;
    const tenant = await this.tenantModel.findOne({ stripeCustomerId: customerId });
    if (!tenant) {
      this.logger.warn(`No tenant found for Stripe customer ${customerId}`);
      return;
    }

    tenant.status = 'SUSPENDED';
    await tenant.save();
    this.logger.warn(`Tenant ${tenant.slug} suspended due to payment failure`);
  }

  async handleSubscriptionDeleted(subscription: Record<string, unknown>) {
    const customerId = subscription.customer as string;
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

  async handleRetellCallStarted(payload: RetellWebhookDto) {
    const { call_id, agent_id } = payload;
    this.logger.log(`Retell call started: ${call_id} for agent ${agent_id}`);
    // Future: update agent instance live status, record call start
  }

  async handleRetellCallEnded(payload: RetellWebhookDto) {
    const { call_id, agent_id, duration_ms } = payload;
    this.logger.log(`Retell call ended: ${call_id} (${duration_ms}ms)`);
    // Future: persist call record, update usage counters
  }

  async handleRetellCallAnalyzed(payload: RetellWebhookDto) {
    const { call_id, summary, sentiment } = payload;
    this.logger.log(`Retell call analyzed: ${call_id} — sentiment: ${sentiment}`);
    // Future: store analysis results, trigger follow-up actions
  }
}

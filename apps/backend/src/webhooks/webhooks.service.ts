import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { AgentInstance, AgentInstanceDocument } from '../agent-instances/schemas/agent-instance.schema';
import { ProcessedEvent, ProcessedEventDocument } from './schemas/processed-event.schema';
import { RetellWebhookDto } from './dto/retell-webhook.dto';
import { CallSession, CallSessionDocument } from '../calls/schemas/call-session.schema';

/** Status order for Retell call events. Higher = more advanced. Prevents downgrades. */
const RETELL_STATUS_ORDER: Record<string, number> = {
  created: 0,
  started: 1,
  ended: 2,
  analyzed: 3,
};

/** Maps Retell event type to call session status. */
function getIncomingStatusFromEvent(event: string): string | null {
  const map: Record<string, string> = {
    call_started: 'started',
    call_ended: 'ended',
    call_analyzed: 'analyzed',
  };
  return map[event] ?? null;
}

interface ResolvedAgentContext {
  tenantId: Types.ObjectId;
  agentInstanceId: Types.ObjectId;
  retellAgentId: string | null;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(AgentInstance.name) private agentModel: Model<AgentInstanceDocument>,
    @InjectModel(ProcessedEvent.name) private processedEventModel: Model<ProcessedEventDocument>,
    @InjectModel(CallSession.name) private callSessionModel: Model<CallSessionDocument>,
  ) {}

  /**
   * Returns true if the event was already processed (duplicate).
   * Returns false if it's new (does NOT record — caller records after processing).
   */
  async isDuplicateEvent(eventId: string, source: string, eventType: string): Promise<boolean> {
    const existing = await this.processedEventModel.findOne({ eventId, source });
    return existing !== null;
  }

  /**
   * Records an event as processed. Call after successful processing (e.g. in queue worker).
   */
  async recordProcessedEvent(eventId: string, source: string, eventType: string): Promise<void> {
    try {
      await this.processedEventModel.create({ eventId, source, eventType });
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as Record<string, unknown>).code === 11000) {
        this.logger.debug(`Duplicate ${source} event already recorded: ${eventId}`);
        return;
      }
      throw err;
    }
  }

  /**
   * Resolves a deterministic event ID for Retell deduplication.
   */
  getRetellEventId(payload: RetellWebhookDto): string {
    const metadataEventId = this.readString(payload.metadata?.event_id);
    return payload.event_id ?? metadataEventId ?? `${payload.call_id ?? 'unknown'}:${payload.event}`;
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
    if (!this.isCallIngestEnabled()) {
      return;
    }
    await this.upsertCallSession(payload, {
      status: 'started',
      startedAt: new Date(),
    });
  }

  async handleRetellCallEnded(payload: RetellWebhookDto) {
    const { call_id, agent_id, duration_ms } = payload;
    this.logger.log(`Retell call ended: ${call_id} (${duration_ms}ms)`);
    if (!this.isCallIngestEnabled()) {
      return;
    }
    await this.upsertCallSession(payload, {
      status: 'ended',
      endedAt: new Date(),
      durationMs: typeof duration_ms === 'number' ? duration_ms : null,
    });
  }

  async handleRetellCallAnalyzed(payload: RetellWebhookDto) {
    const { call_id, summary, sentiment } = payload;
    this.logger.log(`Retell call analyzed: ${call_id} — sentiment: ${sentiment}`);
    if (!this.isCallIngestEnabled()) {
      return;
    }
    await this.upsertCallSession(payload, {
      status: 'analyzed',
      summary: this.readString(summary),
      sentiment: this.readString(sentiment),
      transcript: this.readString(payload.transcript),
      outcome: this.deriveOutcome(summary),
    });
  }

  async handleRetellAlertTriggered(payload: RetellWebhookDto) {
    // Phase 4.4 Handle alert_triggered webhook
    this.logger.log(`Retell alert triggered for call: ${payload.call_id}`);
    const context = await this.resolveAgentContext(payload);
    if (!context) {
      this.logger.warn(`No context found for alert_triggered on call ${payload.call_id}`);
      return;
    }
    // Route to tenant notifications or alerts table in the future
    // For now, we update the call session metadata with the alert flag
    await this.callSessionModel.updateOne(
      { callId: payload.call_id },
      { $set: { 'metadata.alertTriggered': true, 'metadata.lastAlert': new Date() } }
    );
  }

  private isCallIngestEnabled(): boolean {
    const value = this.configService
      .get<string>('CALL_SESSION_INGEST_ENABLED', 'true')
      .toLowerCase()
      .trim();
    return value === 'true';
  }

  private async upsertCallSession(
    payload: RetellWebhookDto,
    patch: Partial<CallSession>,
  ): Promise<void> {
    const callId = this.readString(payload.call_id);
    if (!callId) {
      this.logger.warn('Retell payload missing call_id; skipping call-session upsert');
      return;
    }

    const incomingStatus = getIncomingStatusFromEvent(payload.event);
    const incomingTimestamp = this.readEventTimestamp(payload);

    const existing = await this.callSessionModel
      .findOne({ callId })
      .select('_id status metadata')
      .lean();

    if (existing) {
      const currentStatus = existing.status ?? 'created';
      const currentOrder = RETELL_STATUS_ORDER[currentStatus] ?? RETELL_STATUS_ORDER.created;
      const incomingOrder = incomingStatus
        ? (RETELL_STATUS_ORDER[incomingStatus] ?? -1)
        : -1;

      if (incomingStatus && incomingOrder <= currentOrder) {
        this.logger.debug({
          callId,
          incomingStatus,
          currentStatus,
          message: 'Ignored stale webhook event',
        });
        return;
      }

      const lastEventTs = this.readLastEventTimestamp(existing.metadata);
      if (
        incomingTimestamp !== null &&
        lastEventTs !== null &&
        incomingTimestamp <= lastEventTs
      ) {
        this.logger.debug({
          callId,
          incomingTimestamp,
          lastEventTimestamp: lastEventTs,
          message: 'Ignored webhook event with older timestamp',
        });
        return;
      }
    }

    const metadataPatch: Record<string, unknown> = {
      ...(payload.metadata ?? {}),
      lastEvent: payload.event,
    };
    if (incomingTimestamp !== null) {
      metadataPatch.lastEventTimestamp = incomingTimestamp;
    }

    if (existing) {
      await this.callSessionModel.updateOne(
        { callId },
        {
          $set: {
            ...patch,
            metadata: metadataPatch,
          },
        },
      );
      return;
    }

    const context = await this.resolveAgentContext(payload);
    if (!context) {
      this.logger.warn(`Unable to resolve tenant/agent context for call ${callId}`);
      return;
    }

    await this.callSessionModel.updateOne(
      { callId },
      {
        $setOnInsert: {
          tenantId: context.tenantId,
          agentInstanceId: context.agentInstanceId,
          retellAgentId: context.retellAgentId,
          callId,
          outcome: 'unknown',
        },
        $set: {
          ...patch,
          metadata: metadataPatch,
        },
      },
      { upsert: true },
    );
  }

  /** Extracts event timestamp from payload (ms). Returns null if not present. */
  private readEventTimestamp(payload: RetellWebhookDto): number | null {
    const meta = payload.metadata ?? {};
    const ts = meta.timestamp ?? meta.event_timestamp ?? meta.created_at;
    if (typeof ts === 'number' && Number.isFinite(ts)) {
      return ts > 1e12 ? ts : ts * 1000;
    }
    if (typeof ts === 'string') {
      const parsed = Date.parse(ts);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private readLastEventTimestamp(metadata?: Record<string, unknown> | null): number | null {
    if (!metadata) return null;
    const ts = metadata.lastEventTimestamp;
    if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
    return null;
  }

  private async resolveAgentContext(
    payload: RetellWebhookDto,
  ): Promise<ResolvedAgentContext | null> {
    const metadata = payload.metadata ?? {};
    const metaTenantId = this.readString(metadata.tenant_id);
    const metaAgentInstanceId = this.readString(metadata.agent_instance_id);
    if (
      metaTenantId &&
      metaAgentInstanceId &&
      Types.ObjectId.isValid(metaTenantId) &&
      Types.ObjectId.isValid(metaAgentInstanceId)
    ) {
      return {
        tenantId: new Types.ObjectId(metaTenantId),
        agentInstanceId: new Types.ObjectId(metaAgentInstanceId),
        retellAgentId: this.readString(payload.agent_id),
      };
    }

    const retellAgentId = this.readString(payload.agent_id);
    if (!retellAgentId) {
      return null;
    }
    const agent = await this.agentModel
      .findOne({ retellAgentId, status: { $ne: 'deleted' } })
      .select('_id tenantId retellAgentId');
    if (!agent) {
      return null;
    }
    if (!agent.tenantId) {
      return null;
    }
    return {
      tenantId: agent.tenantId,
      agentInstanceId: agent._id,
      retellAgentId: agent.retellAgentId,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private deriveOutcome(summary?: string): string {
    const normalized = (summary ?? '').toLowerCase();
    if (normalized.includes('booked') || normalized.includes('appointment confirmed')) {
      return 'booked';
    }
    if (normalized.includes('escalat')) {
      return 'escalated';
    }
    if (normalized.includes('failed') || normalized.includes('unable')) {
      return 'failed';
    }
    if (normalized.length > 0) {
      return 'info_only';
    }
    return 'unknown';
  }
}

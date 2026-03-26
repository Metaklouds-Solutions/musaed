import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentDeploymentsService } from '../agent-deployments/agent-deployments.service';
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  ProcessedEvent,
  ProcessedEventDocument,
} from './schemas/processed-event.schema';
import { RetellWebhookDto } from './dto/retell-webhook.dto';
import {
  CallSession,
  CallSessionDocument,
} from '../calls/schemas/call-session.schema';
import { AgentRun, AgentRunDocument } from '../runs/schemas/agent-run.schema';
import { RunEvent, RunEventDocument } from '../runs/schemas/run-event.schema';

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
  source: 'active-deployment' | 'metadata' | 'legacy-instance';
}

interface UpsertCallSessionResult {
  applied: boolean;
  reason?:
    | 'missing_call_id'
    | 'stale_status'
    | 'stale_timestamp'
    | 'no_context';
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly agentDeploymentsService: AgentDeploymentsService,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(AgentInstance.name)
    private agentModel: Model<AgentInstanceDocument>,
    @InjectModel(ProcessedEvent.name)
    private processedEventModel: Model<ProcessedEventDocument>,
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
    @InjectModel(AgentRun.name) private runModel: Model<AgentRunDocument>,
    @InjectModel(RunEvent.name) private runEventModel: Model<RunEventDocument>,
  ) {}

  /**
   * Returns true if the event was already processed (duplicate).
   * Returns false if it's new (does NOT record — caller records after processing).
   */
  async isDuplicateEvent(
    eventId: string,
    source: string,
    eventType: string,
  ): Promise<boolean> {
    const existing = await this.processedEventModel.findOne({
      eventId,
      source,
    });
    return existing !== null;
  }

  /**
   * Atomically claims an event-id for processing.
   * Returns true when this caller owns processing, false when already claimed.
   */
  async claimProcessedEvent(
    eventId: string,
    source: string,
    eventType: string,
  ): Promise<boolean> {
    try {
      await this.processedEventModel.create({ eventId, source, eventType });
      return true;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as Record<string, unknown>).code === 11000
      ) {
        this.logger.debug(
          `Duplicate ${source} event claim skipped: ${eventId}`,
        );
        return false;
      }
      throw err;
    }
  }

  /**
   * Releases a previously claimed event so queue retries can re-process it.
   */
  async releaseProcessedEvent(eventId: string, source: string): Promise<void> {
    await this.processedEventModel.deleteOne({ eventId, source });
  }

  /**
   * Records an event as processed. Call after successful processing (e.g. in queue worker).
   */
  async recordProcessedEvent(
    eventId: string,
    source: string,
    eventType: string,
  ): Promise<void> {
    try {
      await this.processedEventModel.create({ eventId, source, eventType });
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as Record<string, unknown>).code === 11000
      ) {
        this.logger.debug(
          `Duplicate ${source} event already recorded: ${eventId}`,
        );
        return;
      }
      throw err;
    }
  }

  /**
   * Resolves a deterministic event ID for Retell deduplication.
   */
  getRetellEventId(payload: RetellWebhookDto): string {
    const call = this.readCall(payload);
    const metadata = this.readMetadata(payload, call);
    const metadataEventId = this.readString(metadata?.event_id);
    const callId =
      this.readString(payload.call_id) ??
      this.readString(call.call_id) ??
      'unknown';
    const timestamp =
      this.readNumber(payload.event_timestamp) ??
      this.readNumber(metadata?.event_timestamp) ??
      this.readNumber(metadata?.timestamp) ??
      this.readNumber(call.event_timestamp) ??
      Date.now();
    return (
      payload.event_id ??
      metadataEventId ??
      `${callId}-${payload.event}-${Math.floor(timestamp)}`
    );
  }

  // ─── Stripe ────────────────────────────────────────────────

  async handleInvoicePaid(invoice: Record<string, unknown>) {
    const customerId = invoice.customer as string;
    const tenant = await this.tenantModel.findOne({
      stripeCustomerId: customerId,
    });
    if (!tenant) {
      this.logger.warn(`No tenant found for Stripe customer ${customerId}`);
      return;
    }

    const reactivatableStatuses = ['SUSPENDED', 'TRIAL'];
    if (reactivatableStatuses.includes(tenant.status)) {
      const oldStatus = tenant.status;
      tenant.status = 'ACTIVE';
      await tenant.save();
      this.logger.log(
        `Tenant ${tenant.slug} transitioned ${oldStatus} → ACTIVE after payment`,
      );
    }
  }

  async handleInvoiceFailed(invoice: Record<string, unknown>) {
    const customerId = invoice.customer as string;
    const tenant = await this.tenantModel.findOne({
      stripeCustomerId: customerId,
    });
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
    const tenant = await this.tenantModel.findOne({
      stripeCustomerId: customerId,
    });
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
    const call = this.readCall(payload);
    const callId =
      this.readString(payload.call_id) ?? this.readString(call.call_id);
    const agentId =
      this.readString(payload.agent_id) ?? this.readString(call.agent_id);
    const startedAt =
      this.readDateFromTimestamp(call.start_timestamp) ?? new Date();
    this.logger.log(`Retell call started: ${callId} for agent ${agentId}`);
    if (!this.isCallIngestEnabled()) {
      return;
    }
    const analysis = this.readRecord(call.call_analysis);
    const callSessionResult = await this.upsertCallSession(payload, {
      status: 'started',
      startedAt,
      durationMs: this.readNumber(call.duration_ms),
      transcript: this.readString(call.transcript),
      ...this.buildCallSessionTelemetryPatch(call, analysis),
    });
    if (!callSessionResult.applied) {
      return;
    }
    await this.upsertRunFromWebhook(payload, 'running');
  }

  async handleRetellCallEnded(payload: RetellWebhookDto) {
    const call = this.readCall(payload);
    const callId =
      this.readString(payload.call_id) ?? this.readString(call.call_id);
    const durationMs =
      this.readNumber(payload.duration_ms) ?? this.readNumber(call.duration_ms);
    const endedAt =
      this.readDateFromTimestamp(call.end_timestamp) ?? new Date();
    this.logger.log(`Retell call ended: ${callId} (${durationMs}ms)`);
    if (!this.isCallIngestEnabled()) {
      return;
    }
    const analysis = this.readRecord(call.call_analysis);
    const callSessionResult = await this.upsertCallSession(payload, {
      status: 'ended',
      endedAt,
      durationMs: typeof durationMs === 'number' ? durationMs : null,
      transcript: this.readString(call.transcript),
      ...this.buildCallSessionTelemetryPatch(call, analysis),
    });
    if (!callSessionResult.applied) {
      return;
    }
    await this.upsertRunFromWebhook(payload, 'completed');
  }

  async handleRetellCallAnalyzed(payload: RetellWebhookDto) {
    const call = this.readCall(payload);
    const analysis = this.readRecord(call.call_analysis);
    const summary =
      this.readString(payload.summary) ??
      this.readString(analysis.call_summary);
    const sentiment =
      this.readString(payload.sentiment) ??
      this.readString(analysis.user_sentiment);
    const callId =
      this.readString(payload.call_id) ?? this.readString(call.call_id);
    this.logger.log(
      `Retell call analyzed: ${callId} — sentiment: ${sentiment}`,
    );
    if (!this.isCallIngestEnabled()) {
      return;
    }
    const callSessionResult = await this.upsertCallSession(payload, {
      status: 'analyzed',
      summary: this.readString(summary),
      sentiment: this.readString(sentiment),
      transcript:
        this.readString(payload.transcript) ?? this.readString(call.transcript),
      outcome: this.deriveOutcome(summary ?? undefined),
      ...this.buildCallSessionTelemetryPatch(call, analysis),
      customAnalysisData: (() => {
        const custom = this.readRecord(analysis.custom_analysis_data);
        return Object.keys(custom).length > 0 ? custom : undefined;
      })(),
    });
    if (!callSessionResult.applied) {
      return;
    }
    await this.upsertRunFromWebhook(payload, 'completed');
  }

  async handleRetellAlertTriggered(payload: RetellWebhookDto) {
    // Phase 4.4 Handle alert_triggered webhook
    const call = this.readCall(payload);
    const callId =
      this.readString(payload.call_id) ?? this.readString(call.call_id);
    this.logger.log(`Retell alert triggered for call: ${callId}`);
    const context = await this.resolveAgentContext(payload);
    if (!context) {
      this.logger.warn(
        `No context found for alert_triggered on call ${callId}`,
      );
      return;
    }
    // Route to tenant notifications or alerts table in the future
    // For now, we update the call session metadata with the alert flag
    await this.callSessionModel.updateOne(
      { callId },
      {
        $set: {
          'metadata.alertTriggered': true,
          'metadata.lastAlert': new Date(),
        },
      },
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
  ): Promise<UpsertCallSessionResult> {
    const callId = this.readString(payload.call_id);
    const call = this.readCall(payload);
    const normalizedCallId = callId ?? this.readString(call.call_id);
    if (!normalizedCallId) {
      this.logger.warn(
        'Retell payload missing call_id; skipping call-session upsert',
      );
      return { applied: false, reason: 'missing_call_id' };
    }

    const incomingStatus = getIncomingStatusFromEvent(payload.event);
    const incomingTimestamp = this.readEventTimestamp(payload);

    const existing = await this.callSessionModel
      .findOne({ callId: normalizedCallId })
      .select('_id status metadata')
      .lean();

    if (existing) {
      const currentStatus = existing.status ?? 'created';
      const currentOrder =
        RETELL_STATUS_ORDER[currentStatus] ?? RETELL_STATUS_ORDER.created;
      const incomingOrder = incomingStatus
        ? (RETELL_STATUS_ORDER[incomingStatus] ?? -1)
        : -1;

      if (incomingStatus && incomingOrder < currentOrder) {
        this.logger.debug({
          callId,
          incomingStatus,
          currentStatus,
          message: 'Ignored stale webhook event',
        });
        return { applied: false, reason: 'stale_status' };
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
        return { applied: false, reason: 'stale_timestamp' };
      }
    }

    const mergedMetadata = this.readRecord(existing?.metadata);
    const metadataPatch: Record<string, unknown> = {
      ...mergedMetadata,
      ...(payload.metadata ?? {}),
      lastEvent: payload.event,
    };
    if (incomingTimestamp !== null) {
      metadataPatch.lastEventTimestamp = incomingTimestamp;
    }

    if (existing) {
      this.logger.debug(
        `Upserting Retell call session for existing record: callId=${normalizedCallId}`,
      );
      await this.callSessionModel.updateOne(
        { callId: normalizedCallId },
        {
          $set: {
            ...patch,
            metadata: metadataPatch,
          },
        },
      );
      return { applied: true };
    }

    const context = await this.resolveAgentContext(payload);
    if (!context) {
      this.logger.warn(
        `Unable to resolve tenant/agent context for call ${normalizedCallId}`,
      );
      return { applied: false, reason: 'no_context' };
    }

    this.logger.debug(
      `Upserting Retell call session: callId=${normalizedCallId} tenantId=${context.tenantId.toString()} agentInstanceId=${context.agentInstanceId.toString()}`,
    );

    await this.callSessionModel.updateOne(
      { callId: normalizedCallId },
      {
        $setOnInsert: {
          tenantId: context.tenantId,
          agentInstanceId: context.agentInstanceId,
          retellAgentId: context.retellAgentId,
          callId: normalizedCallId,
          outcome: 'unknown',
        },
        $set: {
          ...patch,
          metadata: metadataPatch,
        },
      },
      { upsert: true },
    );
    return { applied: true };
  }

  /** Extracts event timestamp from payload (ms). Returns null if not present. */
  private readEventTimestamp(payload: RetellWebhookDto): number | null {
    const call = this.readCall(payload);
    const meta = this.readMetadata(payload, call) ?? {};
    const ts =
      payload.event_timestamp ??
      meta.timestamp ??
      meta.event_timestamp ??
      meta.created_at ??
      call.event_timestamp;
    if (typeof ts === 'number' && Number.isFinite(ts)) {
      return ts > 1e12 ? ts : ts * 1000;
    }
    if (typeof ts === 'string') {
      const parsed = Date.parse(ts);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private readLastEventTimestamp(
    metadata?: Record<string, unknown> | null,
  ): number | null {
    if (!metadata) return null;
    const ts = metadata.lastEventTimestamp;
    if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
    return null;
  }

  private async resolveAgentContext(
    payload: RetellWebhookDto,
  ): Promise<ResolvedAgentContext | null> {
    const call = this.readCall(payload);
    const metadata = this.readMetadata(payload, call) ?? {};
    const retellAgentId =
      this.readString(payload.agent_id) ?? this.readString(call.agent_id);

    if (retellAgentId) {
      const activeDeployment =
        await this.agentDeploymentsService.findActiveByRetellAgentId(
          retellAgentId,
        );
      if (activeDeployment) {
        this.logger.debug(
          `Resolved webhook context from active deployment: agentId=${retellAgentId} tenantId=${activeDeployment.tenantId.toString()} agentInstanceId=${activeDeployment.agentInstanceId.toString()}`,
        );
        return {
          tenantId: activeDeployment.tenantId,
          agentInstanceId: activeDeployment.agentInstanceId,
          retellAgentId: activeDeployment.retellAgentId,
          source: 'active-deployment',
        };
      }
    }

    const metaTenantId = this.readString(metadata.tenant_id);
    const metaAgentInstanceId = this.readString(metadata.agent_instance_id);
    if (
      metaTenantId &&
      metaAgentInstanceId &&
      Types.ObjectId.isValid(metaTenantId) &&
      Types.ObjectId.isValid(metaAgentInstanceId)
    ) {
      if (retellAgentId) {
        this.logger.debug(
          `Resolved webhook context from metadata fallback after missing active deployment: agentId=${retellAgentId} tenantId=${metaTenantId} agentInstanceId=${metaAgentInstanceId}`,
        );
      }
      return {
        tenantId: new Types.ObjectId(metaTenantId),
        agentInstanceId: new Types.ObjectId(metaAgentInstanceId),
        retellAgentId,
        source: 'metadata',
      };
    }

    if (!retellAgentId) {
      return null;
    }

    const legacyInstance = await this.agentModel
      .findOne({
        retellAgentId,
        status: { $ne: 'deleted' },
      })
      .select('_id tenantId retellAgentId')
      .lean();
    if (!legacyInstance?.tenantId) {
      return null;
    }
    this.logger.debug(
      `Resolved webhook context from legacy instance fallback: agentId=${retellAgentId} tenantId=${legacyInstance.tenantId.toString()} agentInstanceId=${legacyInstance._id.toString()}`,
    );
    return {
      tenantId: legacyInstance.tenantId as Types.ObjectId,
      agentInstanceId: legacyInstance._id as Types.ObjectId,
      retellAgentId: legacyInstance.retellAgentId ?? retellAgentId,
      source: 'legacy-instance',
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private readNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private readBoolean(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
  }

  private readRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private readCall(payload: RetellWebhookDto): Record<string, unknown> {
    return this.readRecord(payload.call);
  }

  private readMetadata(
    payload: RetellWebhookDto,
    call?: Record<string, unknown>,
  ): Record<string, unknown> {
    const top = this.readRecord(payload.metadata);
    const nested = this.readRecord((call ?? this.readCall(payload)).metadata);
    return { ...nested, ...top };
  }

  private readDateFromTimestamp(value: unknown): Date | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    const ms = value > 1e12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async upsertRunFromWebhook(
    payload: RetellWebhookDto,
    status: string,
  ): Promise<void> {
    const call = this.readCall(payload);
    const callId =
      this.readString(payload.call_id) ?? this.readString(call.call_id);
    if (!callId) {
      return;
    }

    const context = await this.resolveAgentContext(payload);
    if (!context) {
      return;
    }

    const callCost = this.readRecord(call.call_cost);
    const llmTokenUsage = this.readRecord(call.llm_token_usage);
    const runEventTs =
      this.readDateFromTimestamp(call.end_timestamp) ?? new Date();
    const startedAt =
      this.readDateFromTimestamp(call.start_timestamp) ?? runEventTs;
    const endedAt = this.readDateFromTimestamp(call.end_timestamp);
    const tokens =
      this.readNumber(llmTokenUsage.average) ??
      this.readNumber(llmTokenUsage.num_requests) ??
      undefined;
    const cost = this.extractCallCost(callCost) ?? 0;

    const run = await this.runModel.findOneAndUpdate(
      { callId, tenantId: context.tenantId },
      {
        $setOnInsert: {
          callId,
          tenantId: context.tenantId,
          startedAt,
        },
        $set: {
          status,
          cost,
          tokens,
          agentVersion:
            this.readString(call.agent_version?.toString()) ?? undefined,
          ...(endedAt ? { endedAt } : {}),
        },
      },
      { upsert: true, new: true },
    );

    await this.runEventModel.create({
      runId: run._id,
      eventType: payload.event,
      payload: {
        eventTimestamp: this.readEventTimestamp(payload),
        callId,
        status,
      },
      timestamp: runEventTs,
    });
  }

  private buildCallSessionTelemetryPatch(
    call: Record<string, unknown>,
    analysis: Record<string, unknown>,
  ): Partial<CallSession> {
    const patch: Partial<CallSession> = {};

    const callCost = this.extractCallCost(call.call_cost);
    if (callCost !== null) {
      patch.callCost = callCost;
    }

    const disconnectionReason = this.readString(call.disconnection_reason);
    if (disconnectionReason) {
      patch.disconnectionReason = disconnectionReason;
    }

    const latency = this.readRecord(call.latency);
    const e2e = this.readRecord(latency.e2e);
    const latencyP50 = this.readNumber(e2e.p50);
    if (latencyP50 !== null) {
      patch.latencyE2e = latencyP50;
    }

    const callSuccessful = this.readBoolean(analysis.call_successful);
    if (callSuccessful !== null) {
      patch.callSuccessful = callSuccessful;
    }

    const tokenUsage = this.readRecord(call.llm_token_usage);
    if (Object.keys(tokenUsage).length > 0) {
      patch.llmTokenUsage = tokenUsage;
      const total = this.extractTokenTotal(tokenUsage);
      if (total !== null) {
        patch.llmTokensTotal = total;
      }
    }

    return patch;
  }

  private extractTokenTotal(tokenUsage: Record<string, unknown>): number | null {
    const keys = [
      'total',
      'total_tokens',
      'prompt_tokens',
      'completion_tokens',
      'input_tokens',
      'output_tokens',
      'average',
      'num_requests',
    ] as const;
    let sum = 0;
    let found = false;
    for (const key of keys) {
      const value = this.readNumber(tokenUsage[key]);
      if (value !== null) {
        sum += value;
        found = true;
      }
    }
    return found ? sum : null;
  }

  private extractCallCost(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const record = this.readRecord(value);
    return (
      this.readNumber(record.combined_cost) ??
      this.readNumber(record.total) ??
      this.readNumber(record.amount) ??
      null
    );
  }

  /**
   * Lists recent processed webhook events (dedupe ledger) for admin dashboards.
   *
   * @param limit - Max rows (1–100)
   * @param skip - Pagination offset
   */
  async listProcessedEvents(
    limit: number,
    skip: number,
  ): Promise<{
    data: Array<{
      eventId: string;
      source: string;
      eventType: string;
      processedAt: string;
    }>;
    total: number;
  }> {
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const safeSkip = Math.max(0, Math.floor(skip));
    const [raw, total] = await Promise.all([
      this.processedEventModel
        .find()
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.processedEventModel.countDocuments(),
    ]);
    const data = raw.map((doc) => {
      const d = doc as {
        eventId?: string;
        source?: string;
        eventType?: string;
        createdAt?: Date;
        processedAt?: Date;
      };
      const at = d.processedAt ?? d.createdAt ?? new Date();
      const processedAt =
        at instanceof Date
          ? at.toISOString()
          : new Date(String(at)).toISOString();
      return {
        eventId: d.eventId ?? '',
        source: d.source ?? '',
        eventType: d.eventType ?? '',
        processedAt,
      };
    });
    return { data, total };
  }

  private deriveOutcome(summary?: string): string {
    const normalized = (summary ?? '').toLowerCase();
    if (
      normalized.includes('booked') ||
      normalized.includes('appointment confirmed')
    ) {
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

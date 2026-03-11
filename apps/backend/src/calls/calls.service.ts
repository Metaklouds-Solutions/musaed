import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../common/constants';
import { CallSession, CallSessionDocument } from './schemas/call-session.schema';
import { RetellClient } from '../retell/retell.client';

interface ListCallsQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  outcome?: string;
  agentId?: string;
}

type JsonRecord = Record<string, unknown>;

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    @InjectModel(CallSession.name)
    private readonly callSessionModel: Model<CallSessionDocument>,
    private readonly retellClient: RetellClient,
  ) {}

  /**
   * Lists call sessions for a single tenant with optional filters.
   */
  async listForTenant(tenantId: string, query: ListCallsQuery) {
    const filter = this.buildFilter(query, tenantId);
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const [data, total] = await Promise.all([
      this.callSessionModel
        .find(filter)
        .populate('agentInstanceId', 'name tenantId')
        .populate('bookingId', 'serviceType date timeSlot status')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.callSessionModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Lists call sessions for admin and supports optional tenant filtering.
   */
  async listForAdmin(query: ListCallsQuery & { tenantId?: string }) {
    const filter = this.buildFilter(query, query.tenantId ?? null);
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const [data, total] = await Promise.all([
      this.callSessionModel
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('agentInstanceId', 'name')
        .populate('bookingId', 'serviceType date timeSlot status')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.callSessionModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Retrieves a tenant-scoped call session by identifier.
   */
  async getByIdForTenant(id: string, tenantId: string, enrich: boolean = false) {
    const call = await this.callSessionModel
      .findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
      .populate('agentInstanceId', 'name')
      .populate('bookingId', 'serviceType date timeSlot status')
      .lean();
    if (!call) {
      throw new NotFoundException('Call session not found');
    }
    if (enrich && call.callId) {
      return this.enrichFromRetell(call.callId);
    }
    return call;
  }

  /**
   * Retrieves a call session by Retell ID for tenant.
   */
  async getByRetellIdForTenant(retellCallId: string, tenantId: string) {
    const call = await this.callSessionModel
      .findOne({ callId: retellCallId, tenantId: new Types.ObjectId(tenantId) })
      .populate('agentInstanceId', 'name')
      .populate('bookingId', 'serviceType date timeSlot status')
      .lean();

    if (call) {
      return call;
    }

    const retellCall = await this.getRetellCallForTenant(retellCallId, tenantId);
    return this.enrichFromRetell(retellCallId, retellCall);
  }

  /**
   * Retrieves a call session by identifier for admin users.
   */
  async getByIdForAdmin(id: string, enrich: boolean = false) {
    const call = await this.callSessionModel
      .findById(id)
      .populate('tenantId', 'name slug')
      .populate('agentInstanceId', 'name')
      .populate('bookingId', 'serviceType date timeSlot status')
      .lean();
    if (!call) {
      throw new NotFoundException('Call session not found');
    }
    if (enrich && call.callId) {
      return this.enrichFromRetell(call.callId);
    }
    return call;
  }

  /**
   * Retrieves a call session by Retell ID for admin.
   */
  async getByRetellIdForAdmin(retellCallId: string) {
    const call = await this.callSessionModel
      .findOne({ callId: retellCallId })
      .populate('tenantId', 'name slug')
      .populate('agentInstanceId', 'name')
      .populate('bookingId', 'serviceType date timeSlot status')
      .lean();

    if (call) {
      return call;
    }

    return this.enrichFromRetell(retellCallId);
  }

  /**
   * Starts a web call for a specific agent instance.
   */
  async createWebCall(agentInstanceId: string, tenantId: string) {
    const instance = await this.callSessionModel.db.model('AgentInstance').findOne({
      _id: agentInstanceId,
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!instance || !instance.retellAgentId) {
      throw new NotFoundException('Agent instance not found or missing Retell configuration');
    }

    return this.retellClient.createWebCall({
      agent_id: instance.retellAgentId,
      metadata: {
        tenant_id: tenantId,
        agent_instance_id: agentInstanceId,
      },
    });
  }

  /**
   * Returns aggregated call metrics for a tenant.
   */
  async getTenantOutcomeMetrics(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const [totalCalls, avgDuration, groupedOutcomes] = await Promise.all([
      this.callSessionModel.countDocuments({ tenantId: tid }),
      this.callSessionModel.aggregate<{ value: number }>([
        { $match: { tenantId: tid, durationMs: { $ne: null } } },
        { $group: { _id: null, value: { $avg: '$durationMs' } } },
      ]),
      this.callSessionModel.aggregate<{ _id: string; count: number }>([
        { $match: { tenantId: tid } },
        { $group: { _id: '$outcome', count: { $sum: 1 } } },
      ]),
    ]);

    const outcomes: Record<string, number> = {
      unknown: 0,
      booked: 0,
      escalated: 0,
      failed: 0,
      info_only: 0,
    };

    for (const row of groupedOutcomes) {
      outcomes[row._id] = row.count;
    }

    return {
      totalCalls,
      avgDurationMs: avgDuration[0]?.value ?? 0,
      outcomes,
    };
  }

  /**
   * Enriches a call session with real-time data from Retell API (transcript, recording, latency).
   * @param retellCallId The ID of the call in Retell.
   */
  async enrichFromRetell(retellCallId: string, callDataInput?: unknown) {
    try {
      const callData = callDataInput ?? (await this.retellClient.getCall(retellCallId));
      const callDataRecord = this.isRecord(callData) ? callData : {};

      const transcriptObject = callDataRecord['transcript_object'];
      const updateData: Partial<CallSession> = {
        recordingUrl: this.readString(callDataRecord['recording_url']) ?? undefined,
        transcript: this.readString(callDataRecord['transcript']) ?? undefined,
        transcriptObject: this.isTranscriptObject(transcriptObject)
          ? transcriptObject
          : undefined,
      };

      const endTimestamp = this.readNumber(callDataRecord['end_timestamp']);
      const startTimestamp = this.readNumber(callDataRecord['start_timestamp']);
      if (endTimestamp !== null && startTimestamp !== null) {
        updateData.durationMs = endTimestamp - startTimestamp;
      }

      const updatedCall = await this.callSessionModel.findOneAndUpdate(
        { callId: retellCallId },
        { $set: updateData },
        { new: true },
      );

      return updatedCall || callData;
    } catch (error) {
      this.logger.error(`Failed to enrich call ${retellCallId} from Retell`, error);
      throw error;
    }
  }

  private async getRetellCallForTenant(retellCallId: string, tenantId: string) {
    const callData = await this.retellClient.getCall(retellCallId);
    const callTenantId = this.extractTenantIdFromRetellCall(callData);

    if (!callTenantId || callTenantId !== tenantId) {
      throw new NotFoundException('Call session not found');
    }

    return callData;
  }

  private extractTenantIdFromRetellCall(callData: unknown): string | null {
    if (!this.isRecord(callData)) {
      return null;
    }

    const metadata = callData['metadata'];
    if (!this.isRecord(metadata)) {
      return null;
    }

    return this.readString(metadata['tenant_id']) ?? this.readString(metadata['tenantId']) ?? null;
  }

  private isTranscriptObject(value: unknown): value is Record<string, unknown> {
    return this.isRecord(value);
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private readNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private buildFilter(
    query: ListCallsQuery & { tenantId?: string | null },
    tenantId: string | null,
  ): FilterQuery<CallSessionDocument> {
    const filter: FilterQuery<CallSessionDocument> = {};

    if (tenantId) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }
    if (query.outcome) {
      filter.outcome = query.outcome;
    }
    if (query.agentId) {
      filter.agentInstanceId = new Types.ObjectId(query.agentId);
    }

    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) {
        createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        createdAt.$lte = new Date(query.to);
      }
      filter.createdAt = createdAt;
    }

    return filter;
  }

  /**
   * Synchronizes all calls from Retell for all active agents.
   */
  async syncAllFromRetell() {
    const agents = (await this.callSessionModel.db.model('AgentInstance').find({
      retellAgentId: { $ne: null },
      status: { $ne: 'deleted' },
    }).select('_id retellAgentId tenantId').limit(1000).lean()) as unknown as Array<{
      _id: Types.ObjectId;
      retellAgentId: string;
      tenantId: Types.ObjectId;
    }>;

    let totalSynced = 0;

    for (const agent of agents) {
      try {
        const calls = await this.retellClient.listCalls({
          filter_criteria: { agent_id: [agent.retellAgentId] }
        });
        
        if (calls && Array.isArray(calls)) {
          for (const callData of calls) {
            const updateData: Partial<CallSession> = {
              tenantId: agent.tenantId,
              agentInstanceId: agent._id,
              retellAgentId: agent.retellAgentId,
              recordingUrl: callData.recording_url || undefined,
              transcript: callData.transcript || undefined,
              transcriptObject: callData.transcript_object ? (callData.transcript_object as any) : undefined,
              status: callData.call_status === 'ended' ? 'analyzed' : 'started',
            };

            if (callData.end_timestamp && callData.start_timestamp) {
              updateData.durationMs = callData.end_timestamp - callData.start_timestamp;
              updateData.startedAt = new Date(callData.start_timestamp);
              updateData.endedAt = new Date(callData.end_timestamp);
            }

            if (callData.call_analysis) {
              updateData.summary = callData.call_analysis.call_summary || undefined;
              updateData.sentiment = callData.call_analysis.user_sentiment || undefined;
              
              const summaryLower = (updateData.summary || '').toLowerCase();
              if (summaryLower.includes('booked') || summaryLower.includes('appointment confirmed')) {
                updateData.outcome = 'booked';
              } else if (summaryLower.includes('escalat')) {
                updateData.outcome = 'escalated';
              } else if (summaryLower.includes('failed') || summaryLower.includes('unable')) {
                updateData.outcome = 'failed';
              } else if (summaryLower.length > 0) {
                updateData.outcome = 'info_only';
              }
            }

            await this.callSessionModel.updateOne(
              { callId: callData.call_id },
              { $setOnInsert: updateData },
              { upsert: true }
            );
            totalSynced++;
          }
        }
      } catch (err) {
        this.logger.error(`Failed to sync calls for agent ${agent._id}`, err);
      }
    }

    return { success: true, totalSynced };
  }
}

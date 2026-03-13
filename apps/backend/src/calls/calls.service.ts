import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../common/constants';
import {
  CallSession,
  CallSessionDocument,
} from './schemas/call-session.schema';
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
        .select('-recordingUrl -transcript -transcriptObject')
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
        .select('-recordingUrl -transcript -transcriptObject')
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
   * Detail view includes transcript, transcriptObject, recordingUrl, summary, sentiment.
   */
  async getByIdForTenant(
    id: string,
    tenantId: string,
    enrich: boolean = false,
  ) {
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
   * Detail view includes transcript, transcriptObject, recordingUrl, summary, sentiment.
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

    const retellCall = await this.getRetellCallForTenant(
      retellCallId,
      tenantId,
    );
    return this.enrichFromRetell(retellCallId, retellCall);
  }

  /**
   * Retrieves a call session by identifier for admin users.
   * Detail view includes transcript, transcriptObject, recordingUrl, summary, sentiment.
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
   * Detail view includes transcript, transcriptObject, recordingUrl, summary, sentiment.
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
    const instance = await this.callSessionModel.db
      .model('AgentInstance')
      .findOne({
        _id: agentInstanceId,
        tenantId: new Types.ObjectId(tenantId),
      });

    if (!instance || !instance.retellAgentId) {
      throw new NotFoundException(
        'Agent instance not found or missing Retell configuration',
      );
    }

    return this.retellClient.createWebCall({
      agent_id: instance.retellAgentId,
      metadata: {
        tenant_id: (
          instance.tenantId ?? new Types.ObjectId(tenantId)
        ).toString(),
        agent_instance_id: instance._id.toString(),
      },
    });
  }

  /**
   * Returns analytics for a tenant (total calls, conversation rate, avg duration, outcomes, sentiment).
   * Uses a single MongoDB aggregation pipeline.
   */
  async getAnalyticsForTenant(
    tenantId: string,
    query: { from?: string; to?: string; agentId?: string },
  ) {
    const filter = this.buildFilter(
      { from: query.from, to: query.to, agentId: query.agentId },
      tenantId,
      { dateField: 'startedAt', defaultLast7Days: true },
    );
    return this.runAnalyticsAggregation(filter);
  }

  /**
   * Returns analytics for admin (all tenants or filtered by tenantId).
   * Uses a single MongoDB aggregation pipeline.
   */
  async getAnalyticsForAdmin(query: {
    from?: string;
    to?: string;
    agentId?: string;
    tenantId?: string;
  }) {
    const filter = this.buildFilter(
      {
        from: query.from,
        to: query.to,
        agentId: query.agentId,
        tenantId: query.tenantId ?? null,
      },
      null,
      { dateField: 'startedAt', defaultLast7Days: true },
    );
    return this.runAnalyticsAggregation(filter);
  }

  /**
   * Runs a single aggregation pipeline to compute all analytics.
   */
  private async runAnalyticsAggregation(
    filter: FilterQuery<CallSessionDocument>,
  ): Promise<{
    totalCalls: number;
    conversationRate: number;
    avgDuration: number;
    successRate: number;
    avgCost: number | null;
    avgLatency: number | null;
    disconnectionReasons: Record<string, number>;
    outcomes: {
      booked: number;
      escalated: number;
      failed: number;
      info_only: number;
      unknown: number;
    };
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }> {
    const OUTCOMES = ['booked', 'escalated', 'failed', 'info_only', 'unknown'];
    const SENTIMENTS = ['positive', 'neutral', 'negative'];

    interface FacetResult {
      main?: {
        totalCalls: number;
        bookedCount: number;
        sumDurationMs: number;
        durationCount: number;
        successRateSum: number;
        successRateCount: number;
        sumCost: number;
        costCount: number;
        sumLatency: number;
        latencyCount: number;
      };
      outcomes: { _id: string; count: number }[];
      sentiments: { _id: string; count: number }[];
      disconnectionReasons: { _id: string | null; count: number }[];
    }

    const result = await this.callSessionModel.aggregate<FacetResult>([
      { $match: filter },
      {
        $facet: {
          main: [
            {
              $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                bookedCount: {
                  $sum: { $cond: [{ $eq: ['$outcome', 'booked'] }, 1, 0] },
                },
                sumDurationMs: { $sum: { $ifNull: ['$durationMs', 0] } },
                durationCount: {
                  $sum: { $cond: [{ $ne: ['$durationMs', null] }, 1, 0] },
                },
                successRateSum: {
                  $sum: {
                    $cond: [
                      { $eq: ['$callSuccessful', true] },
                      1,
                      {
                        $cond: [
                          { $eq: ['$callSuccessful', false] },
                          0,
                          null,
                        ],
                      },
                    ],
                  },
                },
                successRateCount: {
                  $sum: {
                    $cond: [
                      { $in: ['$callSuccessful', [true, false]] },
                      1,
                      0,
                    ],
                  },
                },
                sumCost: { $sum: { $ifNull: ['$callCost', 0] } },
                costCount: {
                  $sum: { $cond: [{ $ne: ['$callCost', null] }, 1, 0] },
                },
                sumLatency: { $sum: { $ifNull: ['$latencyE2e', 0] } },
                latencyCount: {
                  $sum: { $cond: [{ $ne: ['$latencyE2e', null] }, 1, 0] },
                },
              },
            },
          ],
          outcomes: [{ $group: { _id: '$outcome', count: { $sum: 1 } } }],
          sentiments: [
            {
              $group: {
                _id: {
                  $toLower: { $ifNull: ['$sentiment', 'neutral'] },
                },
                count: { $sum: 1 },
              },
            },
          ],
          disconnectionReasons: [
            {
              $group: {
                _id: { $ifNull: ['$disconnectionReason', null] },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          main: { $arrayElemAt: ['$main', 0] },
          outcomes: 1,
          sentiments: 1,
          disconnectionReasons: 1,
        },
      },
    ]);

    const main = result[0]?.main ?? {
      totalCalls: 0,
      bookedCount: 0,
      sumDurationMs: 0,
      durationCount: 0,
      successRateSum: 0,
      successRateCount: 0,
      sumCost: 0,
      costCount: 0,
      sumLatency: 0,
      latencyCount: 0,
    };
    const outcomesArr = result[0]?.outcomes ?? [];
    const sentimentsArr = result[0]?.sentiments ?? [];
    const disconnectionReasonsArr = result[0]?.disconnectionReasons ?? [];

    const totalCalls = main.totalCalls ?? 0;
    const bookedCount = main.bookedCount ?? 0;
    const sumDurationMs = main.sumDurationMs ?? 0;
    const durationCount = main.durationCount ?? 0;
    const successRateCount = main.successRateCount ?? 0;
    const successRateSum = main.successRateSum ?? 0;
    const costCount = main.costCount ?? 0;
    const sumCost = main.sumCost ?? 0;
    const latencyCount = main.latencyCount ?? 0;
    const sumLatency = main.sumLatency ?? 0;

    const outcomes: Record<string, number> = Object.fromEntries(
      OUTCOMES.map((o) => [o, 0]),
    );
    for (const row of outcomesArr) {
      const key = OUTCOMES.includes(row._id) ? row._id : 'unknown';
      outcomes[key] = (outcomes[key] ?? 0) + row.count;
    }

    const sentiment: Record<string, number> = Object.fromEntries(
      SENTIMENTS.map((s) => [s, 0]),
    );
    for (const row of sentimentsArr) {
      const normalized =
        row._id === 'positive'
          ? 'positive'
          : row._id === 'negative'
            ? 'negative'
            : 'neutral';
      sentiment[normalized] = (sentiment[normalized] ?? 0) + row.count;
    }

    const disconnectionReasons: Record<string, number> = {};
    for (const row of disconnectionReasonsArr) {
      const key =
        row._id == null || row._id === ''
          ? 'unknown'
          : String(row._id);
      disconnectionReasons[key] = (disconnectionReasons[key] ?? 0) + row.count;
    }

    const conversationRate = totalCalls > 0 ? bookedCount / totalCalls : 0;
    const avgDurationSec =
      durationCount > 0 ? Math.round(sumDurationMs / durationCount / 1000) : 0;
    const successRate =
      successRateCount > 0 ? successRateSum / successRateCount : 0;
    const avgCost = costCount > 0 ? sumCost / costCount : null;
    const avgLatency = latencyCount > 0 ? sumLatency / latencyCount : null;

    return {
      totalCalls,
      conversationRate,
      avgDuration: avgDurationSec,
      successRate,
      avgCost,
      avgLatency,
      disconnectionReasons,
      outcomes: {
        booked: outcomes.booked,
        escalated: outcomes.escalated,
        failed: outcomes.failed,
        info_only: outcomes.info_only,
        unknown: outcomes.unknown,
      },
      sentiment: {
        positive: sentiment.positive,
        neutral: sentiment.neutral,
        negative: sentiment.negative,
      },
    };
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
      const callData =
        callDataInput ?? (await this.retellClient.getCall(retellCallId));
      const callDataRecord = this.isRecord(callData) ? callData : {};

      const transcriptObject = callDataRecord['transcript_object'];
      const callAnalysis = this.isRecord(callDataRecord['call_analysis'])
        ? (callDataRecord['call_analysis'] as JsonRecord)
        : null;

      const updateData: Partial<CallSession> = {
        recordingUrl:
          this.readString(callDataRecord['recording_url']) ?? undefined,
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

      updateData.disconnectionReason =
        this.readString(callDataRecord['disconnection_reason']) ?? undefined;

      const costVal = this.extractCallCost(callDataRecord['call_cost']);
      if (costVal !== null) {
        updateData.callCost = costVal;
      }

      const latency = this.isRecord(callDataRecord['latency'])
        ? (callDataRecord['latency'] as JsonRecord)
        : null;
      const e2e = this.isRecord(latency?.['e2e']) ? latency!['e2e'] : null;
      const p50 = this.readNumber(this.isRecord(e2e) ? (e2e as JsonRecord)['p50'] : undefined);
      if (p50 !== null) {
        updateData.latencyE2e = p50;
      }

      updateData.callType =
        this.readString(callDataRecord['call_type']) ?? undefined;

      if (callAnalysis) {
        const callSuccessfulVal = this.readBoolean(callAnalysis['call_successful']);
        if (callSuccessfulVal !== null) {
          updateData.callSuccessful = callSuccessfulVal;
        }
        const customData = callAnalysis['custom_analysis_data'];
        if (this.isRecord(customData)) {
          updateData.customAnalysisData = customData;
        }
      }

      const updatedCall = await this.callSessionModel.findOneAndUpdate(
        { callId: retellCallId },
        { $set: updateData },
        { new: true },
      );

      return updatedCall || callData;
    } catch (error) {
      this.logger.error(
        `Failed to enrich call ${retellCallId} from Retell`,
        error,
      );
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

    return (
      this.readString(metadata['tenant_id']) ??
      this.readString(metadata['tenantId']) ??
      null
    );
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

  private readBoolean(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
  }

  /**
   * Extracts combined/total cost from Retell call_cost object.
   * Supports combined_cost, total, or direct number.
   */
  private extractCallCost(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (!this.isRecord(value)) {
      return null;
    }
    const record = value as JsonRecord;
    return (
      this.readNumber(record['combined_cost']) ??
      this.readNumber(record['total']) ??
      null
    );
  }

  private buildFilter(
    query: ListCallsQuery & { tenantId?: string | null },
    tenantId: string | null,
    options?: {
      dateField?: 'createdAt' | 'startedAt';
      defaultLast7Days?: boolean;
    },
  ): FilterQuery<CallSessionDocument> {
    const filter: FilterQuery<CallSessionDocument> = {};
    const dateField = options?.dateField ?? 'createdAt';

    if (tenantId) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }
    if (query.outcome) {
      filter.outcome = query.outcome;
    }
    if (query.agentId) {
      filter.agentInstanceId = new Types.ObjectId(query.agentId);
    }

    const parsedFrom = query.from ? new Date(query.from) : null;
    const parsedTo = query.to ? new Date(query.to) : null;
    const hasValidFrom = parsedFrom !== null && !isNaN(parsedFrom.getTime());
    const hasValidTo = parsedTo !== null && !isNaN(parsedTo.getTime());

    if (hasValidFrom || hasValidTo) {
      const dateFilter: Record<string, Date> = {};
      if (hasValidFrom && parsedFrom) {
        dateFilter.$gte = parsedFrom;
      }
      if (hasValidTo && parsedTo) {
        dateFilter.$lte = parsedTo;
      }
      filter[dateField] = dateFilter;
    } else if (options?.defaultLast7Days) {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filter[dateField] = { $gte: sevenDaysAgo, $lte: now };
    }

    return filter;
  }

  /**
   * Synchronizes all calls from Retell for all active agents.
   */
  async syncAllFromRetell() {
    const agents = (await this.callSessionModel.db
      .model('AgentInstance')
      .find({
        retellAgentId: { $ne: null },
        status: { $ne: 'deleted' },
      })
      .select('_id retellAgentId tenantId')
      .limit(1000)
      .lean()) as unknown as Array<{
      _id: Types.ObjectId;
      retellAgentId: string;
      tenantId: Types.ObjectId;
    }>;

    let totalSynced = 0;

    for (const agent of agents) {
      try {
        const calls = await this.retellClient.listCalls({
          filter_criteria: { agent_id: [agent.retellAgentId] },
        });

        if (calls && Array.isArray(calls)) {
          for (const callData of calls) {
            const callRecord = this.isRecord(callData) ? callData : {};
            const callAnalysis = this.isRecord(callRecord['call_analysis'])
              ? (callRecord['call_analysis'] as JsonRecord)
              : null;
            const transcriptObj = callRecord['transcript_object'];

            const updateData: Partial<CallSession> = {
              tenantId: agent.tenantId,
              agentInstanceId: agent._id,
              retellAgentId: agent.retellAgentId,
              recordingUrl:
                this.readString(callRecord['recording_url']) ?? undefined,
              transcript:
                this.readString(callRecord['transcript']) ?? undefined,
              transcriptObject: this.isTranscriptObject(transcriptObj)
                ? transcriptObj
                : undefined,
              status:
                callRecord['call_status'] === 'ended' ? 'analyzed' : 'started',
            };

            const endTs = this.readNumber(callRecord['end_timestamp']);
            const startTs = this.readNumber(callRecord['start_timestamp']);
            if (endTs !== null && startTs !== null) {
              updateData.durationMs = endTs - startTs;
              updateData.startedAt = new Date(startTs);
              updateData.endedAt = new Date(endTs);
            }

            if (callAnalysis) {
              updateData.summary =
                this.readString(callAnalysis['call_summary']) ?? undefined;
              updateData.sentiment =
                this.readString(callAnalysis['user_sentiment']) ?? undefined;
              updateData.callSuccessful =
                this.readBoolean(callAnalysis['call_successful']) ?? undefined;
              const customData = callAnalysis['custom_analysis_data'];
              updateData.customAnalysisData = this.isRecord(customData)
                ? customData
                : undefined;

              const summaryLower = (updateData.summary || '').toLowerCase();
              if (
                summaryLower.includes('booked') ||
                summaryLower.includes('appointment confirmed')
              ) {
                updateData.outcome = 'booked';
              } else if (summaryLower.includes('escalat')) {
                updateData.outcome = 'escalated';
              } else if (
                summaryLower.includes('failed') ||
                summaryLower.includes('unable')
              ) {
                updateData.outcome = 'failed';
              } else if (summaryLower.length > 0) {
                updateData.outcome = 'info_only';
              }
            }

            updateData.disconnectionReason =
              this.readString(callRecord['disconnection_reason']) ?? undefined;

            const costVal = this.extractCallCost(callRecord['call_cost']);
            if (costVal !== null) {
              updateData.callCost = costVal;
            }

            const latency = this.isRecord(callRecord['latency'])
              ? (callRecord['latency'] as JsonRecord)
              : null;
            const e2e = this.isRecord(latency?.['e2e']) ? latency!['e2e'] : null;
            const p50 = this.readNumber(
              this.isRecord(e2e) ? e2e['p50'] : undefined,
            );
            if (p50 !== null) {
              updateData.latencyE2e = p50;
            }

            updateData.callType =
              this.readString(callRecord['call_type']) ?? undefined;

            const callId = this.readString(callRecord['call_id']);
            if (callId) {
              await this.callSessionModel.updateOne(
                { callId },
                { $set: updateData },
                { upsert: true },
              );
              totalSynced++;
            }
          }
        }
      } catch (err) {
        this.logger.error(`Failed to sync calls for agent ${agent._id}`, err);
      }
    }

    return { success: true, totalSynced };
  }
}

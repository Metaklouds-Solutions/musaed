import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentRun, AgentRunDocument } from './schemas/agent-run.schema';
import { RunEvent, RunEventDocument } from './schemas/run-event.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

export interface RunListItem {
  id: string;
  callId: string;
  tenantId: string;
  tenantName: string;
  cost: number;
  tokens?: number;
  startedAt: string;
  status: string;
}

export interface RunDetail {
  id: string;
  callId: string;
  tenantId: string;
  usage: { cost?: number; tokens?: number };
  startedAt: string;
  agentVersion?: string;
  status: string;
}

export interface RunEventItem {
  id: string;
  runId: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class RunsService {
  constructor(
    @InjectModel(AgentRun.name) private runModel: Model<AgentRunDocument>,
    @InjectModel(RunEvent.name) private runEventModel: Model<RunEventDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  /**
   * List runs with optional tenant filter and pagination.
   */
  async listRuns(
    page: number,
    limit: number,
    tenantId?: string,
  ): Promise<{
    data: RunListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const [docs, total] = await Promise.all([
      this.runModel
        .find(filter)
        .sort({ startedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.runModel.countDocuments(filter),
    ]);

    const tenantIds = [
      ...new Set(docs.map((d) => String(d.tenantId)).filter(Boolean)),
    ];
    const tenants =
      tenantIds.length > 0
        ? await this.tenantModel
            .find({
              _id: { $in: tenantIds.map((id) => new Types.ObjectId(id)) },
            })
            .select('_id name')
            .lean()
        : [];
    const tenantMap = new Map<string, string>(
      tenants.map((t) => [String(t._id), t.name ?? String(t._id)]),
    );

    const data = docs.map((d) => ({
      id: String(d._id),
      callId: d.callId,
      tenantId: String(d.tenantId),
      tenantName: tenantMap.get(String(d.tenantId)) ?? String(d.tenantId),
      cost: d.cost ?? 0,
      tokens: d.tokens,
      startedAt: (d.startedAt ?? d.createdAt ?? new Date()).toISOString(),
      status: d.status ?? 'completed',
    }));

    return { data, total, page, limit };
  }

  /**
   * Get a single run by ID.
   */
  async getRun(id: string): Promise<RunDetail | null> {
    const d = await this.runModel.findById(id).lean();
    if (!d) return null;
    return {
      id: String(d._id),
      callId: d.callId,
      tenantId: String(d.tenantId),
      usage: { cost: d.cost, tokens: d.tokens },
      startedAt: (d.startedAt ?? d.createdAt ?? new Date()).toISOString(),
      agentVersion: d.agentVersion,
      status: d.status ?? 'completed',
    };
  }

  /**
   * Get a run by call ID (for call detail auditor view).
   */
  async getRunByCallId(
    callId: string,
    tenantId?: string,
  ): Promise<RunDetail | null> {
    const filter: Record<string, unknown> = { callId };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const d = await this.runModel
      .findOne(filter)
      .sort({ startedAt: -1 })
      .lean();
    if (!d) return null;
    return {
      id: String(d._id),
      callId: d.callId,
      tenantId: String(d.tenantId),
      usage: { cost: d.cost, tokens: d.tokens },
      startedAt: (d.startedAt ?? d.createdAt ?? new Date()).toISOString(),
      agentVersion: d.agentVersion,
      status: d.status ?? 'completed',
    };
  }

  /**
   * Get events for a run, sorted chronologically.
   */
  async getRunEvents(runId: string): Promise<RunEventItem[]> {
    const docs = await this.runEventModel
      .find({ runId: new Types.ObjectId(runId) })
      .sort({ timestamp: 1 })
      .lean();

    return docs.map((e) => ({
      id: String(e._id),
      runId: String(e.runId),
      eventType: e.eventType,
      payload: e.payload ?? {},
      timestamp: (e.timestamp ?? new Date()).toISOString(),
    }));
  }

  /**
   * Get events for a run, verifying it belongs to the tenant.
   */
  async getRunEventsForTenant(
    runId: string,
    tenantId: string,
  ): Promise<RunEventItem[]> {
    const run = await this.runModel.findOne({
      _id: new Types.ObjectId(runId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    return this.getRunEvents(runId);
  }

  /**
   * Create a new run (called from webhook processing).
   */
  async createRun(data: {
    tenantId: string;
    callId: string;
    cost?: number;
    tokens?: number;
    agentVersion?: string;
    status?: string;
  }): Promise<string> {
    const doc = await this.runModel.create({
      tenantId: new Types.ObjectId(data.tenantId),
      callId: data.callId,
      cost: data.cost ?? 0,
      tokens: data.tokens,
      agentVersion: data.agentVersion,
      status: data.status ?? 'running',
    });
    return String(doc._id);
  }

  /**
   * Add an event to a run.
   */
  async addRunEvent(data: {
    runId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.runEventModel.create({
      runId: new Types.ObjectId(data.runId),
      eventType: data.eventType,
      payload: data.payload ?? {},
    });
  }
}

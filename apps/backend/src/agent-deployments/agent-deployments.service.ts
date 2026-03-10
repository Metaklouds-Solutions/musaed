import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  AgentChannelDeployment,
  AgentChannelDeploymentDocument,
} from './schemas/agent-channel-deployment.schema';

@Injectable()
export class AgentDeploymentsService {
  constructor(
    @InjectModel(AgentChannelDeployment.name)
    private deploymentModel: Model<AgentChannelDeploymentDocument>,
  ) {}

  async create(data: {
    tenantId: string;
    agentInstanceId: string;
    channel: string;
    provider?: string;
    status?: string;
    retellAgentId?: string | null;
    retellConversationFlowId?: string | null;
    flowSnapshot?: Record<string, unknown>;
    error?: string | null;
    createdBy?: string | null;
  }) {
    return this.deploymentModel.create({
      ...data,
      tenantId: new Types.ObjectId(data.tenantId),
      agentInstanceId: new Types.ObjectId(data.agentInstanceId),
      createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : null,
    });
  }

  async findByAgentInstance(
    agentInstanceId: string,
    tenantId?: string,
    options?: { includeFlowSnapshot?: boolean },
  ) {
    const filter: FilterQuery<AgentChannelDeploymentDocument> = {
      agentInstanceId: new Types.ObjectId(agentInstanceId),
      deletedAt: null,
    };
    if (tenantId) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }
    const query = this.deploymentModel.find(filter).sort({ createdAt: -1 });
    if (!options?.includeFlowSnapshot) {
      query.select('-flowSnapshot');
    }
    return query;
  }

  async upsertByChannel(data: {
    tenantId: string;
    agentInstanceId: string;
    channel: string;
    provider?: string;
    status: string;
    retellAgentId?: string | null;
    retellConversationFlowId?: string | null;
    flowSnapshot?: Record<string, unknown>;
    error?: string | null;
    createdBy?: string | null;
  }) {
    const provider = data.provider ?? 'retell';
    return this.deploymentModel.findOneAndUpdate(
      {
        tenantId: new Types.ObjectId(data.tenantId),
        agentInstanceId: new Types.ObjectId(data.agentInstanceId),
        channel: data.channel,
        provider,
        deletedAt: null,
      },
      {
        $setOnInsert: {
          tenantId: new Types.ObjectId(data.tenantId),
          agentInstanceId: new Types.ObjectId(data.agentInstanceId),
          channel: data.channel,
          provider,
        },
        $set: {
          provider,
          status: data.status,
          retellAgentId: data.retellAgentId ?? null,
          retellConversationFlowId: data.retellConversationFlowId ?? null,
          flowSnapshot: data.flowSnapshot ?? {},
          error: data.error ?? null,
          createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : null,
        },
      },
      { upsert: true, new: true },
    );
  }

  async findByTenant(tenantId: string) {
    return this.deploymentModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        deletedAt: null,
      })
      .sort({ createdAt: -1 });
  }

  async softDeleteByTenant(tenantId: string) {
    return this.deploymentModel.updateMany(
      {
        tenantId: new Types.ObjectId(tenantId),
        deletedAt: null,
      },
      {
        $set: { deletedAt: new Date() },
      },
    );
  }
}

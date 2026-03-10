import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AgentInstance, AgentInstanceDocument } from './schemas/agent-instance.schema';
import { UpdatePromptsDto } from './dto/update-prompts.dto';
import { CreateAgentInstanceDto } from './dto/create-agent-instance.dto';
import { AgentDeploymentService } from '../agent-deployments/agent-deployment.service';
import { AgentDeploymentsService } from '../agent-deployments/agent-deployments.service';
import { AgentTemplate, AgentTemplateDocument } from '../agent-templates/schemas/agent-template.schema';
import { AgentRolloutService } from '../agent-deployments/agent-rollout.service';
import { StartConversationDto } from './dto/start-conversation.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(AgentTemplate.name) private templateModel: Model<AgentTemplateDocument>,
    private readonly agentDeploymentService: AgentDeploymentService,
    private readonly agentDeploymentsService: AgentDeploymentsService,
    private readonly agentRolloutService: AgentRolloutService,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name channel')
      .sort({ createdAt: -1 });
  }

  async findAllAdmin(query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const filter: FilterQuery<AgentInstanceDocument> = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.instanceModel
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('templateId', 'name channel')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.instanceModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, tenantId?: string) {
    const filter: FilterQuery<AgentInstanceDocument> = { _id: id };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const instance = await this.instanceModel
      .findOne(filter)
      .populate('templateId')
      .populate('tenantId', 'name slug');

    if (!instance) throw new NotFoundException('Agent instance not found');
    return instance;
  }

  async findByTenantId(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name channel');
  }

  async updatePrompts(id: string, tenantId: string, dto: UpdatePromptsDto) {
    const instance = await this.instanceModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { $set: { customPrompts: dto.customPrompts } },
      { new: true },
    );
    if (!instance) throw new NotFoundException('Agent instance not found');
    return instance;
  }

  async syncAgent(id: string, tenantId: string) {
    const instance = await this.instanceModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!instance) throw new NotFoundException('Agent instance not found');

    // TODO: Call Retell API GET /get-agent/{retellAgentId} and update configSnapshot
    instance.lastSyncedAt = new Date();
    await instance.save();

    return instance;
  }

  async createForTenant(
    tenantId: string,
    dto: CreateAgentInstanceDto,
  ) {
    const template = await this.templateModel.findOne({
      _id: dto.templateId,
      deletedAt: null,
    });
    if (!template) {
      throw new NotFoundException('Agent template not found');
    }

    const created = await this.instanceModel.create({
      tenantId: new Types.ObjectId(tenantId),
      templateId: new Types.ObjectId(dto.templateId),
      name: dto.name ?? '',
      channelsEnabled: dto.channelsEnabled,
      channel: dto.channelsEnabled[0] ?? 'chat',
      templateVersion: template.version ?? 1,
      customConfig: {
        ...(dto.capabilityLevel ? { capabilityLevel: dto.capabilityLevel } : {}),
      },
      status: 'paused',
    });
    if (this.agentRolloutService.isAutoDeployOnCreateEnabled()) {
      this.triggerDeploymentAsync(created._id.toString(), tenantId);
    }
    return created;
  }

  async findAllForAdminTenant(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name slug channel supportedChannels capabilityLevel')
      .sort({ createdAt: -1 });
  }

  async deployForAdmin(id: string) {
    if (!this.agentRolloutService.isDeploymentV2Enabled()) {
      throw new ConflictException('Agent deployment v2 is disabled by feature flag');
    }
    const instance = await this.findById(id);
    await this.agentDeploymentService.enqueueDeployment(
      instance._id.toString(),
      instance.tenantId.toString(),
    );
    return {
      message: 'Deployment queued',
      agentInstanceId: instance._id.toString(),
      tenantId: instance.tenantId.toString(),
      status: 'queued',
    };
  }

  async getDeploymentsForAdmin(id: string) {
    await this.findById(id);
    return this.agentDeploymentsService.findByAgentInstance(id);
  }

  async getDeploymentsForTenant(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.agentDeploymentsService.findByAgentInstance(id, tenantId);
  }

  async startConversationForTenant(id: string, tenantId: string, dto: StartConversationDto) {
    const instance = await this.findById(id, tenantId);
    const deployments = await this.agentDeploymentsService.findByAgentInstance(
      id,
      tenantId,
      { includeFlowSnapshot: false },
    );
    const activeDeployment = deployments.find(
      (deployment) =>
        deployment.channel === dto.channel &&
        deployment.status === 'active' &&
        deployment.deletedAt == null,
    );
    if (!activeDeployment) {
      throw new UnprocessableEntityException(
        `No active ${dto.channel} deployment found for this agent`,
      );
    }

    return {
      agentInstanceId: instance._id.toString(),
      channel: dto.channel,
      retellAgentId: activeDeployment.retellAgentId,
      retellConversationFlowId: activeDeployment.retellConversationFlowId,
      metadata: this.sanitizeConversationMetadata(dto.metadata),
      startedAt: new Date().toISOString(),
    };
  }

  private triggerDeploymentAsync(agentInstanceId: string, tenantId: string): void {
    this.agentDeploymentService.enqueueDeployment(agentInstanceId, tenantId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown deployment enqueue error';
      this.logger.error(
        `Failed to enqueue deployment: agentInstanceId=${agentInstanceId} tenantId=${tenantId} error=${message}`,
      );
    });
  }

  private sanitizeConversationMetadata(
    metadata?: Record<string, string>,
  ): Record<string, string> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && key.trim().length > 0) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

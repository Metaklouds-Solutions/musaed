import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AgentInstance, AgentInstanceDocument } from './schemas/agent-instance.schema';
import { UpdatePromptsDto } from './dto/update-prompts.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CreateAgentInstanceDto } from './dto/create-agent-instance.dto';
import { AgentDeploymentService } from '../agent-deployments/agent-deployment.service';
import { AgentDeploymentsService } from '../agent-deployments/agent-deployments.service';
import { AgentTemplate, AgentTemplateDocument } from '../agent-templates/schemas/agent-template.schema';
import { AgentRolloutService } from '../agent-deployments/agent-rollout.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { RetellClient } from '../retell/retell.client';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectModel(AgentInstance.name) private instanceModel: Model<AgentInstanceDocument>,
    @InjectModel(AgentTemplate.name) private templateModel: Model<AgentTemplateDocument>,
    private readonly agentDeploymentService: AgentDeploymentService,
    private readonly agentDeploymentsService: AgentDeploymentsService,
    private readonly agentRolloutService: AgentRolloutService,
    private readonly retellClient: RetellClient,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name channel')
      .sort({ createdAt: -1 })
      .lean();
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
        .sort({ createdAt: -1 })
        .lean(),
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
      .populate('templateId', 'name channel')
      .lean();
  }

  async update(id: string, dto: UpdateAgentDto) {
    const instance = await this.instanceModel.findById(id);
    if (!instance) throw new NotFoundException('Agent instance not found');
    if (dto.name != null && dto.name.trim().length > 0) {
      instance.name = dto.name.trim();
      await instance.save();
    }
    return instance;
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

    if (instance.retellAgentId) {
      try {
        let retellData;
        if (instance.channel === 'voice' || instance.channelsEnabled.includes('voice')) {
          retellData = await this.retellClient.getAgent(instance.retellAgentId);
        } else {
          retellData = await this.retellClient.getChatAgent(instance.retellAgentId);
        }
        instance.configSnapshot = { ...instance.configSnapshot, ...retellData } as any;
      } catch (err) {
        this.logger.warn(`Failed to sync Retell config for agent ${id}: ${err.message}`);
      }
    }

    instance.lastSyncedAt = new Date();
    await instance.save();

    return instance;
  }

  async syncAgentAdmin(id: string) {
    const instance = await this.instanceModel.findById(id);
    if (!instance) throw new NotFoundException('Agent instance not found');

    if (instance.retellAgentId) {
      try {
        let retellData;
        if (instance.channel === 'voice' || instance.channelsEnabled.includes('voice')) {
          retellData = await this.retellClient.getAgent(instance.retellAgentId);
        } else {
          retellData = await this.retellClient.getChatAgent(instance.retellAgentId);
        }
        instance.configSnapshot = { ...instance.configSnapshot, ...retellData } as any;
      } catch (err) {
        this.logger.warn(`Failed to sync Retell config for agent ${id}: ${err.message}`);
      }
    }

    instance.lastSyncedAt = new Date();
    await instance.save();

    return instance;
  }

  async createForTenant(
    tenantId: string,
    dto: CreateAgentInstanceDto,
  ) {
    const template = await this.getTemplateOrThrow(dto.templateId);
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

  async createUnassigned(dto: CreateAgentInstanceDto) {
    const template = await this.getTemplateOrThrow(dto.templateId);
    return this.instanceModel.create({
      tenantId: null,
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
  }

  async assignToTenant(id: string, tenantId: string) {
    const instance = await this.instanceModel.findById(id);
    if (!instance) throw new NotFoundException('Agent instance not found');
    if (instance.status === 'deleted') {
      throw new ConflictException('Cannot assign a deleted agent');
    }
    if (instance.tenantId && instance.tenantId.toString() !== tenantId) {
      throw new ConflictException('Agent is already assigned to another tenant');
    }
    instance.tenantId = new Types.ObjectId(tenantId);
    await instance.save();
    return instance;
  }

  async unassignFromTenant(id: string) {
    const instance = await this.instanceModel.findById(id);
    if (!instance) throw new NotFoundException('Agent instance not found');
    if (instance.status === 'deploying') {
      throw new ConflictException('Cannot unassign an agent while deployment is in progress');
    }
    instance.tenantId = null;
    await instance.save();
    return instance;
  }

  async findAllForAdminTenant(tenantId: string) {
    return this.instanceModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: { $ne: 'deleted' } })
      .populate('templateId', 'name slug channel supportedChannels capabilityLevel')
      .sort({ createdAt: -1 })
      .lean();
  }

  async deployForAdmin(id: string) {
    if (!this.agentRolloutService.isDeploymentV2Enabled()) {
      throw new ConflictException('Agent deployment v2 is disabled by feature flag');
    }
    const instance = await this.findById(id);
    if (!instance.tenantId) {
      throw new ConflictException('Assign this agent to a tenant before deployment');
    }
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

    if (!activeDeployment.retellAgentId) {
      throw new ConflictException('Agent is not fully deployed to Retell yet');
    }

    const metadata = this.sanitizeConversationMetadata(dto.metadata);
    metadata['tenant_id'] = tenantId;
    metadata['agent_instance_id'] = id;

    if (dto.channel === 'voice') {
      const response = await this.retellClient.createWebCall({
        agent_id: activeDeployment.retellAgentId,
        metadata,
      });
      return {
        agentInstanceId: instance._id.toString(),
        channel: dto.channel,
        retellAgentId: activeDeployment.retellAgentId,
        retellConversationFlowId: activeDeployment.retellConversationFlowId,
        metadata,
        startedAt: new Date().toISOString(),
        accessToken: response.access_token,
      };
    }

    if (dto.channel === 'chat') {
      const response = await this.retellClient.createChat({
        agent_id: activeDeployment.retellAgentId,
        metadata,
      });
      return {
        agentInstanceId: instance._id.toString(),
        channel: dto.channel,
        retellAgentId: activeDeployment.retellAgentId,
        retellConversationFlowId: activeDeployment.retellConversationFlowId,
        metadata,
        startedAt: new Date().toISOString(),
        chatId: response.chat_id,
      };
    }

    throw new UnprocessableEntityException('Unsupported channel');
  }

  async getChat(chatId: string) {
    return this.retellClient.getChat(chatId);
  }

  /**
   * Retrieves a chat, verifying it belongs to the given tenant via metadata.
   */
  async getChatForTenant(chatId: string, tenantId: string) {
    const chat = await this.retellClient.getChat(chatId);
    this.verifyChatTenantOwnership(chat, tenantId);
    return chat;
  }

  async sendChatMessage(chatId: string, messages: unknown[]) {
    return this.retellClient.createChatCompletion(chatId, messages);
  }

  /**
   * Sends a chat message after verifying the chat belongs to the tenant.
   */
  async sendChatMessageForTenant(chatId: string, messages: unknown[], tenantId: string) {
    const chat = await this.retellClient.getChat(chatId);
    this.verifyChatTenantOwnership(chat, tenantId);
    return this.retellClient.createChatCompletion(chatId, messages);
  }

  /**
   * Verifies the chat's metadata.tenant_id matches the requesting tenant.
   */
  private verifyChatTenantOwnership(chat: unknown, tenantId: string): void {
    const metadata =
      chat !== null && typeof chat === 'object' && 'metadata' in chat
        ? (chat as Record<string, unknown>).metadata
        : null;

    const chatTenantId =
      metadata !== null && typeof metadata === 'object'
        ? (metadata as Record<string, unknown>)['tenant_id']
        : undefined;

    if (chatTenantId !== tenantId) {
      throw new ForbiddenException('Chat does not belong to this tenant');
    }
  }

  private async getTemplateOrThrow(templateId: string): Promise<AgentTemplateDocument> {
    const template = await this.templateModel.findOne({
      _id: templateId,
      deletedAt: null,
    });
    if (!template) {
      throw new NotFoundException('Agent template not found');
    }
    return template;
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

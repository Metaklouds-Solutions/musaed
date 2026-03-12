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

  async findAllAdmin(query: {
    status?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, tenantId, page = 1, limit = 20 } = query;
    const filter: FilterQuery<AgentInstanceDocument> = { status: { $ne: 'deleted' } };
    if (status) filter.status = status;
    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      filter.tenantId = new Types.ObjectId(tenantId);
    }

    const [rawData, total] = await Promise.all([
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

    const enriched = await this.enrichWithRetellIds(rawData);
    const data = await this.attachLinkingMetadata(enriched);
    return { data, total, page, limit };
  }

  private async attachLinkingMetadata(
    instances: Array<Record<string, unknown> & { _id?: unknown; sourceAgentInstanceId?: unknown }>,
  ): Promise<Array<Record<string, unknown>>> {
    if (instances.length === 0) return instances;

    const baseIds = Array.from(
      new Set(
        instances
          .map((instance) => {
            const source =
              typeof instance.sourceAgentInstanceId === 'object' &&
              instance.sourceAgentInstanceId &&
              'toString' in instance.sourceAgentInstanceId
                ? (instance.sourceAgentInstanceId as { toString: () => string }).toString()
                : null;
            if (source) return source;
            if (typeof instance._id === 'object' && instance._id && 'toString' in instance._id) {
              return (instance._id as { toString: () => string }).toString();
            }
            if (typeof instance._id === 'string') return instance._id;
            return null;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const objectIds = baseIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const grouped = await this.instanceModel.aggregate<{ _id: Types.ObjectId; linkedTenantCount: number }>([
      {
        $match: {
          status: { $ne: 'deleted' },
          tenantId: { $ne: null },
          $or: [
            { _id: { $in: objectIds } },
            { sourceAgentInstanceId: { $in: objectIds } },
          ],
        },
      },
      {
        $project: {
          baseId: { $ifNull: ['$sourceAgentInstanceId', '$_id'] },
        },
      },
      {
        $group: {
          _id: '$baseId',
          linkedTenantCount: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map<string, number>(
      grouped.map((row) => [row._id.toString(), row.linkedTenantCount]),
    );

    return instances.map((instance) => {
      const source =
        typeof instance.sourceAgentInstanceId === 'object' &&
        instance.sourceAgentInstanceId &&
        'toString' in instance.sourceAgentInstanceId
          ? (instance.sourceAgentInstanceId as { toString: () => string }).toString()
          : null;
      const selfId =
        typeof instance._id === 'object' && instance._id && 'toString' in instance._id
          ? (instance._id as { toString: () => string }).toString()
          : typeof instance._id === 'string'
            ? instance._id
            : null;
      const baseAgentInstanceId = source ?? selfId;

      return {
        ...instance,
        baseAgentInstanceId,
        linkedTenantCount: baseAgentInstanceId ? (countMap.get(baseAgentInstanceId) ?? 0) : 0,
      };
    });
  }

  private async enrichWithRetellIds(
    instances: Array<Record<string, unknown> & { _id?: unknown; retellAgentId?: string | null }>,
  ): Promise<typeof instances> {
    const needsEnrichment = instances.filter((i) => !i.retellAgentId);
    if (needsEnrichment.length === 0) return instances;

    const ids = needsEnrichment
      .map((i) => (typeof i._id === 'object' && i._id && 'toString' in i._id ? (i._id as { toString: () => string }).toString() : String(i._id)))
      .filter(Boolean);
    const deployments = await this.agentDeploymentsService.findByAgentInstanceIds(ids);
    const map = new Map<string, string>();
    for (const d of deployments) {
      const key =
        typeof d.agentInstanceId === 'object' && d.agentInstanceId && 'toString' in d.agentInstanceId
          ? (d.agentInstanceId as { toString: () => string }).toString()
          : String(d.agentInstanceId);
      if (d.retellAgentId && !map.has(key)) map.set(key, d.retellAgentId);
    }

    return instances.map((i) => {
      const id = typeof i._id === 'object' && i._id && 'toString' in i._id ? (i._id as { toString: () => string }).toString() : String(i._id);
      const fromDeployment = map.get(id);
      if (!i.retellAgentId && fromDeployment) {
        return { ...i, retellAgentId: fromDeployment };
      }
      return i;
    });
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
        instance.configSnapshot = { ...instance.configSnapshot, ...retellData } as Record<string, unknown>;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to sync Retell config for agent ${id}: ${errMsg}`);
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
        instance.configSnapshot = { ...instance.configSnapshot, ...retellData } as Record<string, unknown>;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to sync Retell config for agent ${id}: ${errMsg}`);
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
      sourceAgentInstanceId: null,
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
      sourceAgentInstanceId: null,
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
      const sourceId = instance.sourceAgentInstanceId
        ? instance.sourceAgentInstanceId.toString()
        : instance._id.toString();

      const existingForTenant = await this.instanceModel.findOne({
        tenantId: new Types.ObjectId(tenantId),
        status: { $ne: 'deleted' },
        $or: [
          { _id: new Types.ObjectId(sourceId) },
          { sourceAgentInstanceId: new Types.ObjectId(sourceId) },
        ],
      });

      if (existingForTenant) {
        return existingForTenant;
      }

      const cloned = await this.instanceModel.create({
        sourceAgentInstanceId: new Types.ObjectId(sourceId),
        tenantId: new Types.ObjectId(tenantId),
        templateId: instance.templateId,
        name: instance.name,
        templateVersion: instance.templateVersion,
        channelsEnabled: instance.channelsEnabled,
        channel: instance.channel,
        customConfig: instance.customConfig ?? {},
        assignedToStaffIds: [],
        status: 'paused',
        configSnapshot: {},
        customPrompts: instance.customPrompts ?? {},
        resolvedVariables: instance.resolvedVariables ?? {},
        retellAgentId: null,
        retellLlmId: null,
        retellAgentVersion: null,
        emailAddress: null,
        lastSyncedAt: null,
        deployedAt: null,
      });

      if (cloned.templateId && this.agentRolloutService.isDeploymentV2Enabled()) {
        this.triggerDeploymentAsync(cloned._id.toString(), tenantId);
      }

      return cloned;
    }

    instance.tenantId = new Types.ObjectId(tenantId);
    if (!instance.sourceAgentInstanceId) {
      instance.sourceAgentInstanceId = instance._id as Types.ObjectId;
    }
    await instance.save();

    if (
      instance.templateId &&
      !instance.retellAgentId &&
      this.agentRolloutService.isDeploymentV2Enabled()
    ) {
      this.triggerDeploymentAsync(instance._id.toString(), tenantId);
    }

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
      throw new ConflictException(
        'Agent deployment v2 is disabled. Set AGENT_DEPLOYMENT_V2_ENABLED=true in .env',
      );
    }
    const instance = await this.findById(id);
    if (!instance.tenantId) {
      throw new ConflictException('Assign this agent to a tenant before deployment');
    }
    if (!instance.templateId) {
      throw new ConflictException('Agent has no template assigned');
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

  async getTenantLinksForAdmin(id: string) {
    const instance = await this.findById(id);
    const baseId = instance.sourceAgentInstanceId
      ? instance.sourceAgentInstanceId.toString()
      : instance._id.toString();

    const links = await this.instanceModel
      .find({
        status: { $ne: 'deleted' },
        $or: [
          { _id: new Types.ObjectId(baseId) },
          { sourceAgentInstanceId: new Types.ObjectId(baseId) },
        ],
      })
      .populate('tenantId', 'name slug')
      .select('_id tenantId status name sourceAgentInstanceId')
      .sort({ createdAt: -1 })
      .lean();

    return {
      baseAgentInstanceId: baseId,
      links,
    };
  }

  /**
   * Deletes an agent instance: cleans up Retell resources (voice/chat agents and flows),
   * soft-deletes deployments, and marks the instance as deleted.
   * Idempotent: if already deleted, returns successfully (no-op).
   */
  async deleteForAdmin(id: string): Promise<void> {
    const instance = await this.instanceModel.findById(id);
    if (!instance) throw new NotFoundException('Agent instance not found');
    if (instance.status === 'deleted') {
      return;
    }

    const deployments = await this.agentDeploymentsService.findByAgentInstance(id);
    for (const deployment of deployments) {
      if (deployment.retellAgentId) {
        try {
          if (deployment.channel === 'chat') {
            await this.retellClient.deleteChatAgent(deployment.retellAgentId);
          } else {
            await this.retellClient.deleteAgent(deployment.retellAgentId);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Retell agent delete failed agentInstanceId=${id} retellAgentId=${deployment.retellAgentId} error=${message}`,
          );
        }
      }
      if (deployment.retellConversationFlowId) {
        try {
          await this.retellClient.deleteConversationFlow(
            deployment.retellConversationFlowId,
          );
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Retell flow delete failed agentInstanceId=${id} flowId=${deployment.retellConversationFlowId} error=${message}`,
          );
        }
      }
    }

    await this.agentDeploymentsService.softDeleteByAgentInstanceId(id);
    instance.status = 'deleted';
    await instance.save();
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

  async sendChatMessage(chatId: string, content: string) {
    return this.retellClient.createChatCompletion(chatId, content);
  }

  /**
   * Sends a chat message after verifying the chat belongs to the tenant.
   */
  async sendChatMessageForTenant(chatId: string, content: string, tenantId: string) {
    const chat = await this.retellClient.getChat(chatId);
    this.verifyChatTenantOwnership(chat, tenantId);
    return this.retellClient.createChatCompletion(chatId, content);
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

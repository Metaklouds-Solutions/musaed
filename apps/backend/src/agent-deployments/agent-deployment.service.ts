import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConnectionOptions, JobsOptions, Queue, Worker } from 'bullmq';
import { randomUUID } from 'crypto';
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  AgentTemplate,
  AgentTemplateDocument,
} from '../agent-templates/schemas/agent-template.schema';
import { RetellClient } from '../retell/retell.client';
import { AgentDeploymentsService } from './agent-deployments.service';
import { processFlowTemplate } from './utils/flow-processor';
import { AuditService } from '../audit/audit.service';
import { AgentDeploymentMetricsService } from './agent-deployment-metrics.service';

export interface ChannelDeployResult {
  channel: string;
  status: 'active' | 'failed';
  retellAgentId: string | null;
  retellConversationFlowId: string | null;
  error: string | null;
}

interface RetellConversationFlowPayload {
  start_speaker?: string;
  model_choice?: Record<string, unknown>;
  nodes?: unknown[];
  tools?: unknown[];
  [key: string]: unknown;
}

type ProcessedTemplateKind = 'conversation-flow' | 'direct-agent';

export interface AgentDeployResult {
  agentInstanceId: string;
  tenantId: string;
  overallStatus: 'active' | 'partially_deployed' | 'failed';
  channels: ChannelDeployResult[];
}

const REDACTED_KEYS = new Set([
  'authorization',
  'x-api-key',
  'api-key',
  'x_api_key',
  'x-retell-signature',
]);
const SYSTEM_USER_ID = 'system';

/**
 * Orchestrates Retell spin-up for an agent instance across all enabled channels.
 */
@Injectable()
export class AgentDeploymentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentDeploymentService.name);
  private queue: Queue<{
    agentInstanceId: string;
    tenantId: string;
    correlationId: string;
  }> | null = null;
  private worker: Worker<{
    agentInstanceId: string;
    tenantId: string;
    correlationId: string;
  }> | null = null;
  private connection: ConnectionOptions | null = null;

  constructor(
    @InjectModel(AgentInstance.name)
    private readonly agentInstanceModel: Model<AgentInstanceDocument>,
    @InjectModel(AgentTemplate.name)
    private readonly agentTemplateModel: Model<AgentTemplateDocument>,
    private readonly agentDeploymentsService: AgentDeploymentsService,
    private readonly retellClient: RetellClient,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly deploymentMetrics: AgentDeploymentMetricsService,
  ) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const queueEnabled = this.isTruthy(
      this.configService.get<string>(
        'AGENT_DEPLOYMENT_QUEUE_ENABLED',
        nodeEnv === 'production' ? 'true' : 'false',
      ),
    );
    if (!queueEnabled) {
      this.logger.warn(
        'Agent deployment queue disabled (AGENT_DEPLOYMENT_QUEUE_ENABLED=false).',
      );
      return;
    }
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL is not configured. Deployment queue is disabled.',
      );
      return;
    }
    this.connection = this.buildRedisConnection(redisUrl);
    this.queue = new Queue('agent-deployment', {
      connection: this.connection,
    });
    this.worker = new Worker(
      'agent-deployment',
      async (job) =>
        this.deployAgentInstance(
          job.data.agentInstanceId,
          job.data.correlationId,
        ),
      { connection: this.connection, concurrency: 2 },
    );
    this.worker.on('failed', (job, error) => {
      const instanceId = job?.data?.agentInstanceId ?? 'unknown';
      const tenantId = job?.data?.tenantId ?? 'unknown';
      this.logger.error(
        `Deployment job failed (DLQ): agentInstanceId=${instanceId} tenantId=${tenantId} — ${error.message}`,
      );
      Sentry.captureException(error, {
        extra: { agentInstanceId: instanceId, tenantId, jobId: job?.id },
      });
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async enqueueDeployment(
    agentInstanceId: string,
    tenantId: string,
    options?: { attempts?: number; correlationId?: string },
  ) {
    const correlationId = options?.correlationId ?? randomUUID();
    if (!this.queue) {
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        throw new ConflictException('Deployment queue is unavailable');
      }
      this.logger.warn(
        `Queue unavailable. Running deployment inline for agentInstanceId=${agentInstanceId}`,
      );
      return this.deployAgentInstance(agentInstanceId, correlationId);
    }
    const jobOptions: JobsOptions = {
      attempts: options?.attempts ?? 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    };
    return this.queue.add(
      'deploy-agent',
      { agentInstanceId, tenantId, correlationId },
      jobOptions,
    );
  }

  async cleanupDeploymentsForTenant(tenantId: string): Promise<void> {
    const deployments =
      await this.agentDeploymentsService.findByTenant(tenantId);
    for (const deployment of deployments) {
      if (deployment.retellAgentId) {
        try {
          if (deployment.channel === 'chat') {
            await this.retellClient.deleteChatAgent(deployment.retellAgentId);
          } else {
            await this.retellClient.deleteAgent(deployment.retellAgentId);
          }
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Retell agent cleanup failed tenantId=${tenantId} agentId=${deployment.retellAgentId} error=${message}`,
          );
        }
      }
      if (deployment.retellConversationFlowId) {
        try {
          await this.retellClient.deleteConversationFlow(
            deployment.retellConversationFlowId,
          );
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Retell flow cleanup failed tenantId=${tenantId} flowId=${deployment.retellConversationFlowId} error=${message}`,
          );
        }
      }
    }
    await this.agentDeploymentsService.softDeleteByTenant(tenantId);
  }

  /**
   * Deploys all enabled channels for an agent instance and records per-channel status.
   */
  async deployAgentInstance(
    agentInstanceId: string,
    correlationId: string = randomUUID(),
  ): Promise<AgentDeployResult> {
    const startedAt = Date.now();
    const instance = await this.agentInstanceModel.findOneAndUpdate(
      {
        _id: agentInstanceId,
        status: { $nin: ['deploying', 'deleted'] },
      },
      { $set: { status: 'deploying' } },
      { new: true },
    );
    if (!instance) {
      const existing = await this.agentInstanceModel.findById(agentInstanceId);
      if (!existing) {
        throw new NotFoundException('Agent instance not found');
      }
      if (existing.status === 'deleted') {
        throw new NotFoundException('Agent instance not found');
      }
      throw new ConflictException('Agent deployment already in progress');
    }
    const tenantId = this.requireTenantId(instance);

    try {
      const template = await this.loadTemplate(instance.templateId);
      const templateFlow = this.getTemplateFlow(template);
      const apiBaseUrl = this.resolveApiBaseUrl();
      const channels = this.resolveChannels(instance);
      const channelResults: ChannelDeployResult[] = [];

      for (const channel of channels) {
        const result = await this.deployChannel({
          channel,
          templateFlow,
          apiBaseUrl,
          instance,
        });
        channelResults.push(result);
      }

      const successCount = channelResults.filter(
        (item) => item.status === 'active',
      ).length;
      const overallStatus =
        successCount === channelResults.length
          ? 'active'
          : successCount > 0
            ? 'partially_deployed'
            : 'failed';

      instance.status = overallStatus;
      instance.deployedAt = successCount > 0 ? new Date() : instance.deployedAt;
      this.syncLegacyRetellIdentifiers(instance, channelResults);
      await instance.save();
      await this.logDeploymentAudit(instance, overallStatus, channelResults);
      this.deploymentMetrics.record(overallStatus, Date.now() - startedAt);
      this.logStructured('agent.deployment.completed', {
        correlationId,
        agentInstanceId: instance._id.toString(),
        tenantId,
        overallStatus,
        channelCount: channelResults.length,
        latencyMs: Date.now() - startedAt,
      });

      return {
        agentInstanceId: instance._id.toString(),
        tenantId,
        overallStatus,
        channels: channelResults,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown deployment error';
      await this.agentInstanceModel
        .updateOne(
          { _id: instance._id, status: 'deploying' },
          { $set: { status: 'failed' } },
        )
        .catch((updateError: unknown) => {
          const updateMessage =
            updateError instanceof Error
              ? updateError.message
              : 'Unknown status update error';
          this.logger.error(
            `Failed to mark deployment as failed: instance=${instance._id.toString()} error=${updateMessage}`,
          );
        });
      await this.auditService
        .log(
          'agent.deploy_failed',
          SYSTEM_USER_ID,
          {
            agentInstanceId: instance._id.toString(),
            overallStatus: 'failed',
            error: message,
          },
          tenantId,
        )
        .catch((auditError: unknown) => {
          const auditMessage =
            auditError instanceof Error
              ? auditError.message
              : 'Unknown audit error';
          this.logger.error(
            `Failed to write deployment failure audit: instance=${instance._id.toString()} error=${auditMessage}`,
          );
        });
      this.deploymentMetrics.record('failed', Date.now() - startedAt);
      this.logStructured('agent.deployment.failed', {
        correlationId,
        agentInstanceId: instance._id.toString(),
        tenantId,
        error: message,
        latencyMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  private async logDeploymentAudit(
    instance: AgentInstanceDocument,
    overallStatus: 'active' | 'partially_deployed' | 'failed',
    channels: ChannelDeployResult[],
  ): Promise<void> {
    const tenantId = this.requireTenantId(instance);
    const instanceId = instance._id.toString();
    const meta: Record<string, unknown> = {
      agentInstanceId: instanceId,
      channels,
      overallStatus,
    };
    if (overallStatus === 'failed') {
      await this.auditService.log(
        'agent.deploy_failed',
        SYSTEM_USER_ID,
        meta,
        tenantId,
      );
      return;
    }
    await this.auditService.log(
      'agent.deployed',
      SYSTEM_USER_ID,
      meta,
      tenantId,
    );
  }

  private async deployChannel(params: {
    channel: string;
    templateFlow: Record<string, unknown>;
    apiBaseUrl: string;
    instance: AgentInstanceDocument;
  }): Promise<ChannelDeployResult> {
    const { channel, templateFlow, apiBaseUrl, instance } = params;
    const tenantId = this.requireTenantId(instance);
    const instanceId = instance._id.toString();
    let createdRetellAgentId: string | null = null;
    let createdConversationFlowId: string | null = null;

    await this.agentDeploymentsService.upsertByChannel({
      tenantId,
      agentInstanceId: instanceId,
      channel,
      provider: 'retell',
      status: 'pending',
      flowSnapshot: {},
      error: null,
    });

    try {
      const processedFlow = processFlowTemplate(templateFlow, {
        tenantId,
        agentInstanceId: instanceId,
        apiBaseUrl,
        retellToolApiKey:
          this.configService.get<string>('RETELL_TOOL_API_KEY') ?? undefined,
      });
      const sanitizedFlowSnapshot = this.sanitizeFlowSnapshot(processedFlow);
      const flowVersion = this.getFlowVersion(processedFlow);
      const deploymentKind = this.getDeploymentKind(processedFlow);
      let agentResponse: { agent_id: string };
      if (deploymentKind === 'conversation-flow') {
        const conversationFlowPayload =
          this.buildConversationFlowPayload(processedFlow);
        const conversationFlowResponse =
          await this.retellClient.createConversationFlow(
            conversationFlowPayload,
          );
        createdConversationFlowId =
          conversationFlowResponse.conversation_flow_id;

        const responseEngine: Record<string, unknown> = {
          type: 'conversation-flow',
          conversation_flow_id: conversationFlowResponse.conversation_flow_id,
        };

        if (channel === 'voice') {
          const voiceId = this.getVoiceId(processedFlow);
          agentResponse = await this.retellClient.createAgent({
            agent_name: this.getAgentName(instance, channel),
            response_engine: responseEngine,
            voice_id: voiceId,
          });
        } else {
          agentResponse = await this.retellClient.createChatAgent({
            agent_name: this.getAgentName(instance, channel),
            response_engine: responseEngine,
          });
        }
      } else {
        if (channel === 'voice') {
          agentResponse = await this.retellClient.createAgent(
            this.buildDirectAgentPayload(processedFlow, instance, channel),
          );
        } else {
          agentResponse = await this.retellClient.createChatAgent(
            this.buildDirectAgentPayload(processedFlow, instance, channel),
          );
        }
      }
      createdRetellAgentId = agentResponse.agent_id;

      await this.agentDeploymentsService.upsertByChannel({
        tenantId,
        agentInstanceId: instanceId,
        channel,
        provider: 'retell',
        status: 'active',
        retellAgentId: agentResponse.agent_id,
        retellConversationFlowId: createdConversationFlowId,
        flowSnapshot: sanitizedFlowSnapshot,
        error: null,
      });

      return {
        channel,
        status: 'active',
        retellAgentId: agentResponse.agent_id,
        retellConversationFlowId: createdConversationFlowId,
        error: null,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown deployment error';
      this.logger.error(
        `Channel deployment failed: instance=${instanceId} channel=${channel} error=${message}`,
      );
      if (createdRetellAgentId) {
        await this.retellClient
          .deleteAgent(createdRetellAgentId)
          .catch((cleanupError: unknown) => {
            const cleanupMessage =
              cleanupError instanceof Error
                ? cleanupError.message
                : 'Unknown cleanup error';
            this.logger.warn(
              `Retell agent rollback failed: instance=${instanceId} channel=${channel} agentId=${createdRetellAgentId} error=${cleanupMessage}`,
            );
          });
      }
      if (createdConversationFlowId) {
        await this.retellClient
          .deleteConversationFlow(createdConversationFlowId)
          .catch((cleanupError: unknown) => {
            const cleanupMessage =
              cleanupError instanceof Error
                ? cleanupError.message
                : 'Unknown cleanup error';
            this.logger.warn(
              `Retell flow rollback failed: instance=${instanceId} channel=${channel} flowId=${createdConversationFlowId} error=${cleanupMessage}`,
            );
          });
      }
      await this.agentDeploymentsService.upsertByChannel({
        tenantId,
        agentInstanceId: instanceId,
        channel,
        provider: 'retell',
        status: 'failed',
        retellAgentId: createdRetellAgentId,
        retellConversationFlowId: createdConversationFlowId,
        flowSnapshot: {},
        error: message,
      });
      return {
        channel,
        status: 'failed',
        retellAgentId: createdRetellAgentId,
        retellConversationFlowId: createdConversationFlowId,
        error: message,
      };
    }
  }

  private async loadTemplate(
    templateId: Types.ObjectId | null,
  ): Promise<AgentTemplateDocument> {
    if (!templateId) {
      throw new NotFoundException('Agent template is not assigned');
    }
    const template = await this.agentTemplateModel.findOne({
      _id: templateId,
      deletedAt: null,
    });
    if (!template) {
      throw new NotFoundException('Agent template not found');
    }
    return template;
  }

  private getTemplateFlow(
    template: AgentTemplateDocument,
  ): Record<string, unknown> {
    const flow = template.flowTemplate;
    if (!flow || typeof flow !== 'object' || Array.isArray(flow)) {
      throw new NotFoundException('Template flow is missing or invalid');
    }
    return flow;
  }

  private resolveChannels(instance: AgentInstanceDocument): string[] {
    if (instance.channelsEnabled.length > 0) {
      return instance.channelsEnabled;
    }
    if (instance.channel) {
      return [instance.channel];
    }
    throw new NotFoundException('No channels enabled for this agent instance');
  }

  private resolveApiBaseUrl(): string {
    const configured = this.configService.get<string>('API_BASE_URL')?.trim();
    if (configured) {
      return configured;
    }
    const port = this.configService.get<string>('PORT')?.trim() || '3001';
    const fallback = `http://localhost:${port}`;
    this.logger.warn(
      `API_BASE_URL is not configured. Falling back to ${fallback}. Configure API_BASE_URL for non-local deployments.`,
    );
    return fallback;
  }

  private buildConversationFlowPayload(
    processedFlow: Record<string, unknown>,
  ): RetellConversationFlowPayload {
    const rawConversationFlow = processedFlow.conversationFlow;
    if (
      !rawConversationFlow ||
      typeof rawConversationFlow !== 'object' ||
      Array.isArray(rawConversationFlow)
    ) {
      throw new NotFoundException(
        'Processed flow missing conversationFlow payload',
      );
    }
    return rawConversationFlow as RetellConversationFlowPayload;
  }

  private buildDirectAgentPayload(
    processedFlow: Record<string, unknown>,
    instance: AgentInstanceDocument,
    channel: string,
  ): Record<string, unknown> {
    const payload = structuredClone(processedFlow);
    payload.agent_name = this.getAgentName(instance, channel);
    if (channel !== 'voice') {
      delete payload.voice_id;
      delete payload.voice_model;
      delete payload.fallback_voice_ids;
      delete payload.voice_temperature;
      delete payload.voice_speed;
      delete payload.volume;
      delete payload.enable_backchannel;
      delete payload.backchannel_words;
      delete payload.ambient_sound;
      delete payload.ambient_sound_volume;
      delete payload.interruption_sensitivity;
      delete payload.max_call_duration_ms;
      delete payload.end_call_after_silence_ms;
      delete payload.begin_message_delay_ms;
      delete payload.stt_mode;
      delete payload.custom_stt_config;
      delete payload.denoising_mode;
      delete payload.allow_user_dtmf;
      delete payload.user_dtmf_options;
    }
    return payload;
  }

  private getDeploymentKind(
    processedFlow: Record<string, unknown>,
  ): ProcessedTemplateKind {
    const responseEngine = processedFlow.response_engine;
    if (
      responseEngine &&
      typeof responseEngine === 'object' &&
      !Array.isArray(responseEngine) &&
      (responseEngine as Record<string, unknown>).type === 'conversation-flow'
    ) {
      return 'conversation-flow';
    }
    if (processedFlow.conversationFlow) {
      return 'conversation-flow';
    }
    return 'direct-agent';
  }

  private getFlowVersion(processedFlow: Record<string, unknown>): number {
    const maybeResponseEngine = processedFlow.response_engine;
    if (
      maybeResponseEngine &&
      typeof maybeResponseEngine === 'object' &&
      !Array.isArray(maybeResponseEngine)
    ) {
      const version = (maybeResponseEngine as Record<string, unknown>).version;
      if (typeof version === 'number') {
        return version;
      }
    }
    return 0;
  }

  private getVoiceId(processedFlow: Record<string, unknown>): string {
    const voiceId = processedFlow.voice_id;
    if (typeof voiceId !== 'string' || voiceId.trim().length === 0) {
      throw new NotFoundException(
        'voice_id is required in flow template for voice channel',
      );
    }
    return voiceId;
  }

  private getAgentName(
    instance: AgentInstanceDocument,
    channel: string,
  ): string {
    const base = instance.name?.trim() || instance._id.toString();
    return `${base}-${channel}`;
  }

  private syncLegacyRetellIdentifiers(
    instance: AgentInstanceDocument,
    channels: ChannelDeployResult[],
  ): void {
    const primaryChannel = instance.channelsEnabled[0] ?? instance.channel;
    const primaryDeployment = channels.find(
      (item) => item.channel === primaryChannel,
    );
    if (!primaryDeployment || primaryDeployment.status !== 'active') {
      instance.retellAgentId = null;
      instance.retellLlmId = null;
      return;
    }
    instance.retellAgentId = primaryDeployment.retellAgentId;
    instance.retellLlmId = primaryDeployment.retellConversationFlowId;
  }

  private buildRedisConnection(redisUrl: string): ConnectionOptions {
    const parsed = new URL(redisUrl);
    const dbPath = parsed.pathname.replace('/', '').trim();
    const db = dbPath.length > 0 ? Number.parseInt(dbPath, 10) : 0;
    return {
      host: parsed.hostname,
      port: Number.parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: Number.isNaN(db) ? 0 : db,
      maxRetriesPerRequest: null,
    };
  }

  private sanitizeFlowSnapshot(
    flow: Record<string, unknown>,
  ): Record<string, unknown> {
    const cloned = structuredClone(flow) as unknown;
    return this.redactRecursive(cloned) as Record<string, unknown>;
  }

  private redactRecursive(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactRecursive(item));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        next[key] = '***';
      } else {
        next[key] = this.redactRecursive(item);
      }
    }
    return next;
  }

  private requireTenantId(instance: AgentInstanceDocument): string {
    if (!instance.tenantId) {
      throw new ConflictException(
        'Agent must be assigned to a tenant before deployment',
      );
    }
    return instance.tenantId.toString();
  }

  private logStructured(event: string, payload: Record<string, unknown>): void {
    this.logger.log(
      JSON.stringify({
        event,
        ...payload,
      }),
    );
  }

  private isTruthy(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string')
      return value.toLowerCase() === 'true' || value === '1';
    return false;
  }
}

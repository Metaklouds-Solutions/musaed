import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Connection, Model } from 'mongoose';
import { Queue } from 'bullmq';
import { RetellClient } from '../retell/retell.client';
import { NotificationsService } from '../notifications/notifications.service';
import { QUEUE_NAMES } from '../queue/queue.constants';
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);
  private readonly dedupe = new Map<string, number>();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectQueue(QUEUE_NAMES.WEBHOOKS) private readonly webhooksQueue: Queue,
    private readonly config: ConfigService,
    private readonly retellClient: RetellClient,
    private readonly notificationsService: NotificationsService,
    @InjectModel(AgentInstance.name)
    private readonly agentModel: Model<AgentInstanceDocument>,
  ) {}

  @Cron('*/45 * * * * *')
  async run(): Promise<void> {
    await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRetell(),
      this.checkAgents(),
      this.checkWebhookQueueDepth(),
    ]);
  }

  private async checkDatabase(): Promise<void> {
    if (this.connection.readyState !== 1) {
      await this.notifyOnce('db_down', {
        type: 'database_connection_lost',
        source: 'database',
        severity: 'critical',
        title: 'Database connection lost',
        message: `MongoDB readyState=${this.connection.readyState}`,
        priority: 'critical',
      });
    }
  }

  private async checkRedis(): Promise<void> {
    if (!this.isRedisRequired()) {
      return;
    }
    try {
      const client = await this.webhooksQueue.client;
      await client.ping();
    } catch (error) {
      await this.notifyOnce('redis_down', {
        type: 'redis_disconnected',
        source: 'system',
        severity: 'critical',
        title: 'Redis disconnected',
        message:
          error instanceof Error ? error.message : 'Unable to ping Redis',
        priority: 'critical',
      });
    }
  }

  private async checkRetell(): Promise<void> {
    const probe = await this.retellClient.probeConnectivity();
    if (!probe.reachable) {
      await this.notifyOnce('retell_down', {
        type: 'retell_api_failure',
        source: 'retell',
        severity: 'important',
        title: 'Retell API connectivity issue',
        message: `Retell probe failed with status ${probe.statusCode ?? 'unknown'}`,
        priority: 'high',
      });
    }
  }

  private async checkAgents(): Promise<void> {
    const staleBefore = new Date(Date.now() - 15 * 60_000);
    const staleAgents = await this.agentModel
      .find({
        status: { $in: ['active', 'partially_deployed'] },
        lastSyncedAt: { $ne: null, $lt: staleBefore },
      })
      .select('_id name tenantId status lastSyncedAt')
      .limit(10)
      .lean();

    for (const agent of staleAgents) {
      const id = agent._id.toString();
      await this.notifyOnce(`agent_stale_${id}`, {
        type: 'agent_stopped_responding',
        source: 'agents',
        severity: 'important',
        title: `Agent "${agent.name ?? id}" stopped responding`,
        message: `Agent sync heartbeat missing for over 15 minutes.`,
        tenantId: agent.tenantId ? String(agent.tenantId) : null,
        metadata: {
          agentInstanceId: id,
          status: agent.status,
          lastSyncedAt: agent.lastSyncedAt,
        },
        priority: 'high',
      });
    }
  }

  private async checkWebhookQueueDepth(): Promise<void> {
    /** BullMQ queue uses Redis; skip when no queue features are enabled (avoids noisy errors if Redis is down). */
    if (!this.isRedisRequired()) {
      return;
    }
    try {
      const waiting = await this.webhooksQueue.getWaitingCount();
      const delayed = await this.webhooksQueue.getDelayedCount();
      const depth = waiting + delayed;
      if (depth > 500) {
        await this.notifyOnce('webhook_queue_depth', {
          type: 'worker_queue_failure',
          source: 'system',
          severity: 'important',
          title: 'Webhook queue backlog is high',
          message: `Current webhook queue depth is ${depth}.`,
          metadata: { depth, waiting, delayed },
          priority: 'high',
        });
      }
    } catch (error) {
      this.logger.warn(
        `Queue depth check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async notifyOnce(
    key: string,
    payload: {
      type: string;
      source: string;
      severity: 'critical' | 'important' | 'normal' | 'info';
      title: string;
      message: string;
      tenantId?: string | null;
      metadata?: Record<string, unknown>;
      priority?: string;
    },
  ): Promise<void> {
    const now = Date.now();
    const cooldownMs = 5 * 60_000;
    const last = this.dedupe.get(key) ?? 0;
    if (now - last < cooldownMs) return;
    this.dedupe.set(key, now);

    await this.notificationsService.createForAdmins({
      type: payload.type,
      source: payload.source,
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
      priority: payload.priority,
      dedupeKey: `${payload.type}:${key}`,
      dedupeWindowSeconds: 30 * 60,
    });

    if (payload.tenantId) {
      await this.notificationsService.createForTenantStaff(payload.tenantId, {
        tenantId: payload.tenantId,
        type: payload.type,
        source: payload.source,
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata,
        priority: payload.priority,
        dedupeKey: `${payload.type}:${key}`,
        dedupeWindowSeconds: 30 * 60,
      });
    }
  }

  private isRedisRequired(): boolean {
    const queueFlags = [
      this.config.get<string>('AGENT_DEPLOYMENT_QUEUE_ENABLED', 'false'),
      this.config.get<string>('QUEUE_WEBHOOKS_ENABLED', 'false'),
      this.config.get<string>('QUEUE_EMAIL_ENABLED', 'false'),
      this.config.get<string>('QUEUE_NOTIFICATIONS_ENABLED', 'false'),
    ];
    return queueFlags.some((value) => value?.trim().toLowerCase() === 'true');
  }
}

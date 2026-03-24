import { Controller, Get, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Connection } from 'mongoose';
import { Queue } from 'bullmq';
import { RetellClient } from '../retell/retell.client';
import { AgentDeploymentMetricsService } from '../agent-deployments/agent-deployment-metrics.service';
import { QUEUE_NAMES } from '../queue/queue.constants';

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Health check endpoint. Reports status of MongoDB, Redis, and Retell.
 * Returns 'ok' only when all critical dependencies are healthy.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectQueue(QUEUE_NAMES.WEBHOOKS) private readonly webhooksQueue: Queue,
    private readonly retellClient: RetellClient,
    private readonly deploymentMetrics: AgentDeploymentMetricsService,
  ) {}

  @Get()
  async check() {
    const dbState = this.connection.readyState;
    const dbUp = dbState === 1;

    const redisStatus = await this.checkRedis();

    const retellProbe = await this.retellClient.probeConnectivity();
    const metrics = this.deploymentMetrics.getSnapshot();

    const retellOk = retellProbe.skipped ? true : retellProbe.reachable;

    const isHealthy = dbUp && redisStatus.up && retellOk;

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbUp ? 'up' : 'down',
          state: DB_STATES[dbState] ?? 'unknown',
        },
        redis: {
          status: redisStatus.up ? 'up' : 'down',
          latencyMs: redisStatus.latencyMs,
          error: redisStatus.error,
        },
        retell: {
          status: retellProbe.skipped
            ? 'skipped'
            : retellProbe.reachable
              ? 'up'
              : 'down',
          statusCode: retellProbe.statusCode,
        },
      },
      metrics: {
        agentDeployments: metrics,
      },
    };
  }

  private static readonly REDIS_TIMEOUT_MS = 3000;

  private async checkRedis(): Promise<{
    up: boolean;
    latencyMs: number | null;
    error: string | undefined;
  }> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Redis health check timed out')),
          HealthController.REDIS_TIMEOUT_MS,
        ),
      );
      const probe = (async () => {
        const client = await this.webhooksQueue.client;
        const start = Date.now();
        await client.ping();
        return {
          up: true as const,
          latencyMs: Date.now() - start,
          error: undefined,
        };
      })();
      return await Promise.race([probe, timeout]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown Redis error';
      this.logger.warn(`Redis health check failed: ${message}`);
      return { up: false, latencyMs: null, error: message };
    }
  }
}

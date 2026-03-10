import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RetellClient } from '../retell/retell.client';
import { AgentDeploymentMetricsService } from '../agent-deployments/agent-deployment-metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly retellClient: RetellClient,
    private readonly deploymentMetrics: AgentDeploymentMetricsService,
  ) {}

  @Get()
  async check() {
    const dbState = this.connection.readyState;
    const DB_STATES: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    const retellProbe = await this.retellClient.probeConnectivity();
    const metrics = this.deploymentMetrics.getSnapshot();
    const isHealthy = dbState === 1 && retellProbe.reachable;

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbState === 1 ? 'up' : 'down',
          state: DB_STATES[dbState] ?? 'unknown',
        },
        retell: {
          status: retellProbe.reachable ? 'up' : 'down',
          statusCode: retellProbe.statusCode,
        },
      },
      metrics: {
        agentDeployments: metrics,
      },
    };
  }
}

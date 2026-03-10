import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DeploymentSample {
  status: 'active' | 'partially_deployed' | 'failed';
  latencyMs: number;
}

export interface DeploymentMetricsSnapshot {
  total: number;
  success: number;
  failed: number;
  averageLatencyMs: number;
  failureRate: number;
}

const DEFAULT_ALERT_THRESHOLD = 0.3;
const MIN_SAMPLE_SIZE_FOR_ALERT = 10;

/**
 * Tracks in-memory deployment metrics for health and alerting signals.
 */
@Injectable()
export class AgentDeploymentMetricsService {
  private readonly logger = new Logger(AgentDeploymentMetricsService.name);
  private readonly samples: DeploymentSample[] = [];
  private readonly failureAlertThreshold: number;

  constructor(private readonly configService: ConfigService) {
    const configuredThreshold = this.configService.get<number>(
      'AGENT_DEPLOYMENT_FAILURE_ALERT_THRESHOLD',
    );
    this.failureAlertThreshold =
      typeof configuredThreshold === 'number' && configuredThreshold > 0 && configuredThreshold < 1
        ? configuredThreshold
        : DEFAULT_ALERT_THRESHOLD;
  }

  /**
   * Records deployment status and latency for observability.
   */
  record(status: 'active' | 'partially_deployed' | 'failed', latencyMs: number): void {
    const sample: DeploymentSample = {
      status,
      latencyMs: Math.max(0, latencyMs),
    };
    this.samples.push(sample);
    if (this.samples.length > 1000) {
      this.samples.shift();
    }

    const snapshot = this.getSnapshot();
    const shouldAlert =
      snapshot.total >= MIN_SAMPLE_SIZE_FOR_ALERT &&
      snapshot.failureRate >= this.failureAlertThreshold;
    if (shouldAlert) {
      this.logger.error(
        JSON.stringify({
          event: 'agent.deployment.failure_rate_alert',
          threshold: this.failureAlertThreshold,
          ...snapshot,
        }),
      );
    }
  }

  /**
   * Returns aggregate deployment metrics for health checks and monitoring.
   */
  getSnapshot(): DeploymentMetricsSnapshot {
    const total = this.samples.length;
    const failed = this.samples.filter((item) => item.status === 'failed').length;
    const success = total - failed;
    const totalLatency = this.samples.reduce((sum, item) => sum + item.latencyMs, 0);
    return {
      total,
      success,
      failed,
      averageLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
      failureRate: total > 0 ? failed / total : 0,
    };
  }
}

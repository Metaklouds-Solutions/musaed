import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import {
  CallSession,
  CallSessionDocument,
} from '../calls/schemas/call-session.schema';
import {
  AgentInstance,
  AgentInstanceDocument,
} from './schemas/agent-instance.schema';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationsService } from '../notifications/notifications.service';

const FAILURE_HEALTHY_MAX = 0.05;
const FAILURE_WARNING_MAX = 0.15;
const HEALTH_CHECK_MIN_CALLS = 10;
const HEALTH_CHECK_WINDOW_DAYS = 7;

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface AgentHealthResult {
  agentInstanceId: string;
  healthStatus: HealthStatus;
  failureRate: number;
  hangRate: number;
  averageDuration: number;
  totalCalls: number;
}

export interface AgentAnalytics {
  totalCalls: number;
  successRate: number;
  failureRate: number;
  averageDuration: number;
  sentimentDistribution: Record<string, number>;
  outcomes: Record<string, number>;
}

/**
 * Service for calculating agent health metrics and analytics from CallSession data.
 * Runs a periodic health check and creates alerts for unhealthy agents.
 */
@Injectable()
export class AgentHealthService {
  private readonly logger = new Logger(AgentHealthService.name);

  constructor(
    @InjectModel(CallSession.name)
    private callSessionModel: Model<CallSessionDocument>,
    @InjectModel(AgentInstance.name)
    private agentModel: Model<AgentInstanceDocument>,
    private alertsService: AlertsService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Verifies that an agent belongs to the specified tenant.
   * Throws NotFoundException if the agent does not exist or does not belong to the tenant.
   */
  async verifyAgentOwnership(
    agentInstanceId: string,
    tenantId: string,
  ): Promise<void> {
    const agent = await this.agentModel
      .findOne({
        _id: new Types.ObjectId(agentInstanceId),
        tenantId: new Types.ObjectId(tenantId),
      })
      .select('_id')
      .lean();

    if (!agent) {
      throw new NotFoundException('Agent instance not found');
    }
  }

  /**
   * Returns analytics for a single agent.
   *
   * @param agentInstanceId - The agent instance's MongoDB ID
   * @param tenantId - Optional tenant ID for ownership verification
   * @param dateFrom - Optional start date filter
   * @param dateTo - Optional end date filter
   */
  async getAnalytics(
    agentInstanceId: string,
    tenantId?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<AgentAnalytics> {
    if (tenantId) {
      await this.verifyAgentOwnership(agentInstanceId, tenantId);
    }
    const match: Record<string, unknown> = {
      agentInstanceId: new Types.ObjectId(agentInstanceId),
    };

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.$gte = dateFrom;
      if (dateTo) createdAt.$lte = dateTo;
      match.createdAt = createdAt;
    }

    const [result] = await this.callSessionModel.aggregate<{
      totalCalls: number;
      avgDuration: number;
      outcomes: { _id: string; count: number }[];
      sentiments: { _id: string; count: number }[];
    }>([
      { $match: match },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                avgDuration: { $avg: { $ifNull: ['$durationMs', 0] } },
              },
            },
          ],
          outcomes: [{ $group: { _id: '$outcome', count: { $sum: 1 } } }],
          sentiments: [
            { $match: { sentiment: { $ne: null } } },
            { $group: { _id: '$sentiment', count: { $sum: 1 } } },
          ],
        },
      },
      {
        $project: {
          totalCalls: {
            $ifNull: [{ $arrayElemAt: ['$stats.totalCalls', 0] }, 0],
          },
          avgDuration: {
            $ifNull: [{ $arrayElemAt: ['$stats.avgDuration', 0] }, 0],
          },
          outcomes: 1,
          sentiments: 1,
        },
      },
    ]);

    const totalCalls = result?.totalCalls ?? 0;
    const avgDuration = result?.avgDuration ?? 0;

    const outcomes: Record<string, number> = {};
    for (const o of result?.outcomes ?? []) {
      outcomes[o._id ?? 'unknown'] = o.count;
    }

    const sentimentDistribution: Record<string, number> = {};
    for (const s of result?.sentiments ?? []) {
      sentimentDistribution[s._id ?? 'unknown'] = s.count;
    }

    const failedCount = outcomes['failed'] ?? 0;
    const bookedCount = outcomes['booked'] ?? 0;
    const failureRate = totalCalls > 0 ? failedCount / totalCalls : 0;
    const successRate = totalCalls > 0 ? bookedCount / totalCalls : 0;

    return {
      totalCalls,
      successRate,
      failureRate,
      averageDuration: Math.round(avgDuration),
      sentimentDistribution,
      outcomes,
    };
  }

  /**
   * Calculates health status for a single agent based on recent calls.
   *
   * @param agentInstanceId - The agent instance's MongoDB ID
   * @param tenantId - Optional tenant ID for ownership verification
   */
  async getHealth(
    agentInstanceId: string,
    tenantId?: string,
  ): Promise<AgentHealthResult> {
    if (tenantId) {
      await this.verifyAgentOwnership(agentInstanceId, tenantId);
    }
    const since = new Date();
    since.setDate(since.getDate() - HEALTH_CHECK_WINDOW_DAYS);

    const [result] = await this.callSessionModel.aggregate<{
      totalCalls: number;
      failedCalls: number;
      avgDuration: number;
      hungCalls: number;
    }>([
      {
        $match: {
          agentInstanceId: new Types.ObjectId(agentInstanceId),
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          failedCalls: {
            $sum: { $cond: [{ $eq: ['$outcome', 'failed'] }, 1, 0] },
          },
          avgDuration: { $avg: { $ifNull: ['$durationMs', 0] } },
          hungCalls: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'ended'] },
                    { $lt: [{ $ifNull: ['$durationMs', 0] }, 3000] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalCalls = result?.totalCalls ?? 0;
    const failedCalls = result?.failedCalls ?? 0;
    const hungCalls = result?.hungCalls ?? 0;
    const avgDuration = result?.avgDuration ?? 0;

    const failureRate = totalCalls > 0 ? failedCalls / totalCalls : 0;
    const hangRate = totalCalls > 0 ? hungCalls / totalCalls : 0;

    let healthStatus: HealthStatus = 'healthy';
    if (failureRate > FAILURE_WARNING_MAX) {
      healthStatus = 'critical';
    } else if (failureRate > FAILURE_HEALTHY_MAX) {
      healthStatus = 'warning';
    }

    return {
      agentInstanceId,
      healthStatus,
      failureRate,
      hangRate,
      averageDuration: Math.round(avgDuration),
      totalCalls,
    };
  }

  /**
   * Periodic health check for all active agents.
   * Creates alerts and notifications when agents are critical.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runHealthCheck(): Promise<void> {
    const agents = await this.agentModel
      .find({ status: 'active' })
      .select('_id tenantId name')
      .lean();

    let criticalCount = 0;

    for (const agent of agents) {
      try {
        const health = await this.getHealth(agent._id.toString());
        if (health.totalCalls < HEALTH_CHECK_MIN_CALLS) continue;

        if (health.healthStatus === 'critical' && agent.tenantId) {
          criticalCount++;
          const tenantId = agent.tenantId.toString();
          const agentName = agent.name ?? 'Unknown';
          const pct = (health.failureRate * 100).toFixed(1);

          await this.alertsService.createAlert(tenantId, {
            type: 'agent_health_critical',
            title: `Agent "${agentName}" is unhealthy`,
            message: `Failure rate is ${pct}% over the last ${HEALTH_CHECK_WINDOW_DAYS} days (${health.totalCalls} calls).`,
            severity: 'critical',
          });

          await this.notificationsService.createForTenantStaff(tenantId, {
            tenantId,
            type: 'agent_health_critical',
            title: `Agent "${agentName}" experiencing high failure rate`,
            message: `Failure rate: ${pct}% — ${Math.round(health.failureRate * health.totalCalls)} failures out of ${health.totalCalls} calls in the last ${HEALTH_CHECK_WINDOW_DAYS} days.`,
            priority: 'high',
          });

          await this.notificationsService.createForAdmins({
            type: 'agent_health_critical',
            title: `Agent "${agentName}" experiencing high failure rate`,
            message: `Failure rate: ${pct}% — tenant agent is critical. Review agent configuration.`,
            priority: 'high',
          });
        }
      } catch (err) {
        this.logger.error(
          `Health check failed for agent ${agent._id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    if (criticalCount > 0) {
      this.logger.warn(
        `Health check complete: ${criticalCount} critical agent(s) detected`,
      );
    }
  }
}

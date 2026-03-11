import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health/health.controller';
import { getConnectionToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bullmq';
import { RetellClient } from './retell/retell.client';
import { AgentDeploymentMetricsService } from './agent-deployments/agent-deployment-metrics.service';
import { QUEUE_NAMES } from './queue/queue.constants';

const mockRedisClient = { ping: jest.fn().mockResolvedValue('PONG') };

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.WEBHOOKS),
          useValue: { client: Promise.resolve(mockRedisClient) },
        },
        {
          provide: RetellClient,
          useValue: {
            probeConnectivity: jest.fn().mockResolvedValue({
              reachable: true,
              statusCode: 200,
            }),
          },
        },
        {
          provide: AgentDeploymentMetricsService,
          useValue: {
            getSnapshot: jest.fn().mockReturnValue({
              total: 0,
              success: 0,
              failed: 0,
              averageLatencyMs: 0,
              failureRate: 0,
            }),
          },
        },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return health status payload', async () => {
      const result = await healthController.check();
      expect(result).toEqual(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
        }),
      );
      expect(result.checks.redis).toEqual(
        expect.objectContaining({ status: 'up' }),
      );
    });
  });
});

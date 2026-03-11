import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { RetellWebhookController } from './retell.webhook.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookQueueService } from '../queue/webhook-queue.service';
import { MetricsService } from '../metrics/metrics.service';
import * as crypto from 'crypto';

describe('RetellWebhookController', () => {
  let controller: RetellWebhookController;
  let webhooksService: WebhooksService;

  const mockWebhookQueue = {
    isEnabled: jest.fn().mockReturnValue(false),
    add: jest.fn(),
  };

  const mockMetrics = { recordWebhookReceived: jest.fn() };

  const mockWebhooksService = {
    getRetellEventId: jest.fn().mockReturnValue('evt_123'),
    isDuplicateEvent: jest.fn().mockResolvedValue(false),
    recordProcessedEvent: jest.fn().mockResolvedValue(undefined),
    handleRetellCallStarted: jest.fn().mockResolvedValue(undefined),
    handleRetellCallEnded: jest.fn().mockResolvedValue(undefined),
    handleRetellCallAnalyzed: jest.fn().mockResolvedValue(undefined),
    handleRetellAlertTriggered: jest.fn().mockResolvedValue(undefined),
  };

  const secret = 'test_webhook_secret_32_chars_min';
  const rawBody = JSON.stringify({ event: 'call_started', call_id: 'call_1' });
  const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockWebhookQueue.isEnabled.mockReturnValue(false);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetellWebhookController],
      providers: [
        { provide: WebhooksService, useValue: mockWebhooksService },
        { provide: WebhookQueueService, useValue: mockWebhookQueue },
        { provide: MetricsService, useValue: mockMetrics },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              const defaults: Record<string, string> = {
                NODE_ENV: 'development',
                RETELL_WEBHOOK_SECRET: secret,
                RETELL_WEBHOOK_SECRET_LEGACY: '',
                WEBHOOK_TIMESTAMP_MAX_AGE_SEC: '0',
              };
              return defaults[key] ?? def ?? '';
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<RetellWebhookController>(RetellWebhookController);
    webhooksService = module.get<WebhooksService>(WebhooksService);
  });

  it('accepts valid signature', async () => {
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;
    const result = await controller.handleWebhook(req, mockRes, validSignature, undefined);
    expect(result).toEqual({ received: true });
    expect(mockMetrics.recordWebhookReceived).toHaveBeenCalledWith('retell');
    expect(mockWebhooksService.handleRetellCallStarted).toHaveBeenCalled();
  });

  it('rejects invalid signature', async () => {
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;
    await expect(
      controller.handleWebhook(req, mockRes, 'invalid_signature_hex', undefined),
    ).rejects.toThrow('Invalid webhook signature');
    expect(mockWebhooksService.handleRetellCallStarted).not.toHaveBeenCalled();
  });

  it('rejects missing signature when secret is configured', async () => {
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;
    await expect(controller.handleWebhook(req, mockRes, undefined, undefined)).rejects.toThrow(
      'Missing webhook signature',
    );
  });

  it('accepts legacy secret during rotation', async () => {
    const legacySecret = 'legacy_secret_32_chars_minimum';
    const legacySig = crypto.createHmac('sha256', legacySecret).update(rawBody).digest('hex');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetellWebhookController],
      providers: [
        { provide: WebhooksService, useValue: mockWebhooksService },
        { provide: WebhookQueueService, useValue: mockWebhookQueue },
        { provide: MetricsService, useValue: mockMetrics },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              const defaults: Record<string, string> = {
                NODE_ENV: 'production',
                RETELL_WEBHOOK_SECRET: secret,
                RETELL_WEBHOOK_SECRET_LEGACY: legacySecret,
                WEBHOOK_TIMESTAMP_MAX_AGE_SEC: '0',
              };
              return defaults[key] ?? def ?? '';
            }),
          },
        },
      ],
    }).compile();

    const ctrl = module.get<RetellWebhookController>(RetellWebhookController);
    const req = { body: Buffer.from(rawBody, 'utf8') } as unknown as Request;
    const result = await ctrl.handleWebhook(req, mockRes, legacySig, undefined);
    expect(result).toEqual({ received: true });
    expect(mockWebhooksService.handleRetellCallStarted).toHaveBeenCalled();
  });
});

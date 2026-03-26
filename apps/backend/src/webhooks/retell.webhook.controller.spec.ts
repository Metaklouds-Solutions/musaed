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

  const mockWebhookQueue = {
    isEnabled: jest.fn().mockReturnValue(false),
    add: jest.fn(),
  };

  const mockMetrics = { recordWebhookReceived: jest.fn() };

  const mockWebhooksService = {
    getRetellEventId: jest.fn().mockReturnValue('evt_123'),
    claimProcessedEvent: jest.fn().mockResolvedValue(true),
    isDuplicateEvent: jest.fn().mockResolvedValue(false),
    recordProcessedEvent: jest.fn().mockResolvedValue(undefined),
    handleRetellCallStarted: jest.fn().mockResolvedValue(undefined),
    handleRetellCallEnded: jest.fn().mockResolvedValue(undefined),
    handleRetellCallAnalyzed: jest.fn().mockResolvedValue(undefined),
    handleRetellAlertTriggered: jest.fn().mockResolvedValue(undefined),
  };

  const secret = 'test_webhook_secret_32_chars_min';
  const rawBody = JSON.stringify({ event: 'call_started', call_id: 'call_1' });
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  async function createController(overrides: Record<string, string> = {}) {
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
                ...overrides,
              };
              return defaults[key] ?? def ?? '';
            }),
          },
        },
      ],
    }).compile();

    return module.get<RetellWebhookController>(RetellWebhookController);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockWebhookQueue.isEnabled.mockReturnValue(false);
    controller = await createController();
  });

  it('falls back to inline processing when the webhook queue is disabled', async () => {
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;

    const result = await controller.handleWebhook(
      req,
      mockRes,
      validSignature,
      undefined,
    );
    expect(result).toEqual({ received: true });
    expect(mockWebhookQueue.add).not.toHaveBeenCalled();
    expect(mockMetrics.recordWebhookReceived).toHaveBeenCalledWith('retell');
    expect(mockWebhooksService.handleRetellCallStarted).toHaveBeenCalled();
    expect(mockWebhooksService.recordProcessedEvent).toHaveBeenCalledWith(
      'evt_123',
      'retell',
      'call_started',
    );
  });

  it('queues valid events when webhook queue is enabled', async () => {
    mockWebhookQueue.isEnabled.mockReturnValue(true);
    mockWebhookQueue.add.mockResolvedValue('job-123');
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;

    const result = await controller.handleWebhook(
      req,
      mockRes,
      validSignature,
      undefined,
    );

    expect(result).toEqual({ received: true, queued: true });
    expect(mockWebhookQueue.add).toHaveBeenCalledWith({
      source: 'retell',
      eventId: 'evt_123',
      eventType: 'call_started',
      payload: { event: 'call_started', call_id: 'call_1' },
    });
    expect(mockMetrics.recordWebhookReceived).toHaveBeenCalledWith('retell');
  });

  it('falls back to inline processing when enqueue returns no job id', async () => {
    mockWebhookQueue.isEnabled.mockReturnValue(true);
    mockWebhookQueue.add.mockResolvedValue(null);
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;

    const result = await controller.handleWebhook(
      req,
      mockRes,
      validSignature,
      undefined,
    );
    expect(result).toEqual({ received: true });
    expect(mockWebhooksService.handleRetellCallStarted).toHaveBeenCalled();
  });

  it('rejects invalid signature', async () => {
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;
    await expect(
      controller.handleWebhook(
        req,
        mockRes,
        'invalid_signature_hex',
        undefined,
      ),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('rejects missing signature when secret is configured', async () => {
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;
    await expect(
      controller.handleWebhook(req, mockRes, undefined, undefined),
    ).rejects.toThrow('Missing webhook signature');
  });

  it('accepts legacy secret during rotation', async () => {
    const legacySecret = 'legacy_secret_32_chars_minimum';
    const legacySig = crypto
      .createHmac('sha256', legacySecret)
      .update(rawBody)
      .digest('hex');

    mockWebhookQueue.isEnabled.mockReturnValue(true);
    mockWebhookQueue.add.mockResolvedValue('job-456');
    const ctrl = await createController({
      NODE_ENV: 'production',
      RETELL_WEBHOOK_SECRET_LEGACY: legacySecret,
    });
    const req = { body: Buffer.from(rawBody, 'utf8') } as unknown as Request;
    const result = await ctrl.handleWebhook(req, mockRes, legacySig, undefined);
    expect(result).toEqual({ received: true, queued: true });
    expect(mockWebhookQueue.add).toHaveBeenCalled();
  });

  it('requires timestamp header when replay protection is enabled', async () => {
    controller = await createController({
      WEBHOOK_TIMESTAMP_MAX_AGE_SEC: '600',
    });
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;

    await expect(
      controller.handleWebhook(req, mockRes, validSignature, undefined),
    ).rejects.toThrow('Missing webhook timestamp');
  });
});

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { MetricsService } from '../metrics/metrics.service';
import { WebhookQueueService } from '../queue/webhook-queue.service';
import { StripeWebhookController } from './stripe.webhook.controller';

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;

  const mockWebhookQueue = {
    isEnabled: jest.fn().mockReturnValue(false),
    add: jest.fn(),
  };

  const mockMetrics = { recordWebhookReceived: jest.fn() };

  const secretKey = 'sk_test_123';
  const webhookSecret = 'whsec_test_123';
  const payload = JSON.stringify({
    id: 'evt_123',
    type: 'invoice.payment_succeeded',
    data: { object: { customer: 'cus_123' } },
  });
  const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  async function createController(overrides: Record<string, string> = {}) {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        { provide: WebhookQueueService, useValue: mockWebhookQueue },
        { provide: MetricsService, useValue: mockMetrics },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              const defaults: Record<string, string> = {
                NODE_ENV: 'development',
                STRIPE_SECRET_KEY: secretKey,
                STRIPE_WEBHOOK_SECRET: webhookSecret,
                STRIPE_WEBHOOK_SECRET_LEGACY: '',
                ...overrides,
              };
              return defaults[key] ?? def ?? '';
            }),
          },
        },
      ],
    }).compile();

    return module.get(StripeWebhookController);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockWebhookQueue.isEnabled.mockReturnValue(false);
    controller = await createController();
  });

  it('rejects when the webhook queue is disabled', async () => {
    const req = { body: Buffer.from(payload, 'utf8') } as unknown as Request;

    await expect(
      controller.handleWebhook(req, mockRes, signature),
    ).rejects.toThrow('Stripe webhook queue is unavailable or disabled');
    expect(mockWebhookQueue.add).not.toHaveBeenCalled();
  });

  it('queues valid events when webhook queue is enabled', async () => {
    mockWebhookQueue.isEnabled.mockReturnValue(true);
    mockWebhookQueue.add.mockResolvedValue('job-123');
    const req = { body: Buffer.from(payload, 'utf8') } as unknown as Request;

    const result = await controller.handleWebhook(req, mockRes, signature);

    expect(result).toEqual({ received: true, queued: true });
    expect(mockWebhookQueue.add).toHaveBeenCalledWith({
      source: 'stripe',
      eventId: 'evt_123',
      eventType: 'invoice.payment_succeeded',
      payload: { customer: 'cus_123' },
    });
    expect(mockMetrics.recordWebhookReceived).toHaveBeenCalledWith('stripe');
  });

  it('rejects when enqueue returns no job id', async () => {
    mockWebhookQueue.isEnabled.mockReturnValue(true);
    mockWebhookQueue.add.mockResolvedValue(null);
    const req = { body: Buffer.from(payload, 'utf8') } as unknown as Request;

    await expect(
      controller.handleWebhook(req, mockRes, signature),
    ).rejects.toThrow('Stripe webhook queue is unavailable or disabled');
  });

  it('rejects invalid signatures', async () => {
    const req = { body: Buffer.from(payload, 'utf8') } as unknown as Request;

    await expect(
      controller.handleWebhook(req, mockRes, 'bad_signature'),
    ).rejects.toThrow('Invalid signature');
  });
});

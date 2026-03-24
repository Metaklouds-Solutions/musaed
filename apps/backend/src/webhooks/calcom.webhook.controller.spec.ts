import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import * as crypto from 'crypto';
import { BookingsService } from '../bookings/bookings.service';
import { MetricsService } from '../metrics/metrics.service';
import { CalcomWebhookController } from './calcom.webhook.controller';
import { WebhooksService } from './webhooks.service';

describe('CalcomWebhookController', () => {
  let controller: CalcomWebhookController;

  const mockBookingsService = {
    upsertFromCalcomWebhook: jest
      .fn()
      .mockResolvedValue({ processed: true, bookingId: 'booking-1' }),
  };
  const mockWebhooksService = {
    isDuplicateEvent: jest.fn().mockResolvedValue(false),
    recordProcessedEvent: jest.fn().mockResolvedValue(undefined),
  };
  const mockMetrics = {
    recordWebhookReceived: jest.fn(),
  };

  async function createController(secret = '') {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalcomWebhookController],
      providers: [
        { provide: BookingsService, useValue: mockBookingsService },
        { provide: WebhooksService, useValue: mockWebhooksService },
        { provide: MetricsService, useValue: mockMetrics },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const values: Record<string, string> = {
                CALCOM_WEBHOOK_SECRET: secret,
              };
              return values[key] ?? defaultValue ?? '';
            }),
          },
        },
      ],
    }).compile();

    return module.get(CalcomWebhookController);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await createController();
  });

  it('returns 400 for malformed JSON payloads', async () => {
    const req = {
      body: Buffer.from('{"broken"', 'utf8'),
    } as unknown as Request;

    const result = controller.handleWebhook(req);

    await expect(result).rejects.toThrow(BadRequestException);
    await expect(result).rejects.toThrow(
      'Invalid Cal.com webhook payload',
    );
  });

  it('accepts valid signed requests', async () => {
    controller = await createController('calcom-secret');
    const rawBody = JSON.stringify({
      triggerEvent: 'BOOKING_CREATED',
      id: 'evt-1',
    });
    const signature = crypto
      .createHmac('sha256', 'calcom-secret')
      .update(rawBody)
      .digest('hex');
    const req = {
      body: Buffer.from(rawBody, 'utf8'),
    } as unknown as Request;

    const result = await controller.handleWebhook(req, signature);

    expect(result).toMatchObject({ received: true, synced: true });
    expect(mockBookingsService.upsertFromCalcomWebhook).toHaveBeenCalledWith({
      triggerEvent: 'BOOKING_CREATED',
      id: 'evt-1',
    });
  });

  it('rejects missing signature when secret is configured', async () => {
    controller = await createController('calcom-secret');
    const req = {
      body: Buffer.from(JSON.stringify({ triggerEvent: 'BOOKING_CREATED' })),
    } as unknown as Request;

    await expect(controller.handleWebhook(req)).rejects.toThrow(
      ForbiddenException,
    );
  });
});

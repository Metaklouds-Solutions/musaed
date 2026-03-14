import { ConfigService } from '@nestjs/config';
import { EmailQueueService } from './email.queue.service';

describe('EmailQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null and isEnabled=false when REDIS_URL is empty', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'REDIS_URL') return '';
        if (key === 'QUEUE_EMAIL_ENABLED') return 'true';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new EmailQueueService(config);
    const result = await service.enqueueEmail('invite', {
      to: 'user@example.com',
      name: 'Test',
      token: 'tok_123',
    });

    expect(result).toBeNull();
    expect(service.isEnabled()).toBe(false);
  });

  it('returns null and isEnabled=false when QUEUE_EMAIL_ENABLED is false', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        if (key === 'QUEUE_EMAIL_ENABLED') return 'false';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new EmailQueueService(config);
    const result = await service.enqueueEmail('invite', {
      to: 'user@example.com',
      name: 'Test',
      token: 'tok_123',
    });

    expect(result).toBeNull();
    expect(service.isEnabled()).toBe(false);
  });
});

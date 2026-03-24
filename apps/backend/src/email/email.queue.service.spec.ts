import { ConfigService } from '@nestjs/config';
import { EmailQueueService } from './email.queue.service';

const mockQueueInstance = {
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  getWaitingCount: jest.fn().mockResolvedValue(0),
  getDelayedCount: jest.fn().mockResolvedValue(0),
};

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => mockQueueInstance),
}));

describe('EmailQueueService', () => {
  const buildConfig = (overrides: Record<string, string> = {}) =>
    ({
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          REDIS_URL: 'redis://localhost:6379',
          QUEUE_EMAIL_ENABLED: 'false',
          NODE_ENV: 'development',
          ...overrides,
        };
        return map[key];
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueueInstance.add.mockResolvedValue({ id: 'job-123' });
  });

  it('returns null and isEnabled=false when QUEUE_EMAIL_ENABLED is 0', async () => {
    const config = buildConfig({ QUEUE_EMAIL_ENABLED: '0' });

    const service = new EmailQueueService(config);
    const result = await service.enqueueEmail('invite', {
      to: 'user@example.com',
      name: 'Test',
      token: 'tok_123',
    });

    expect(result).toBeNull();
    expect(service.isEnabled()).toBe(false);
  });

  it('enables the queue when QUEUE_EMAIL_ENABLED is yes', async () => {
    const config = buildConfig({ QUEUE_EMAIL_ENABLED: 'yes' });

    const service = new EmailQueueService(config);
    const result = await service.enqueueEmail('invite', {
      to: 'user@example.com',
      name: 'Test',
      token: 'tok_123',
    });

    expect(service.isEnabled()).toBe(true);
    expect(result).toBe('job-123');
    expect(mockQueueInstance.add).toHaveBeenCalledWith(
      'invite',
      {
        type: 'invite',
        payload: {
          to: 'user@example.com',
          name: 'Test',
          token: 'tok_123',
        },
      },
      expect.objectContaining({
        jobId: expect.stringContaining('email:invite:user@example.com:'),
      }),
    );
  });
});

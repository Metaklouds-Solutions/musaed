import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const configMock = {
    get: jest.fn((key: string, def?: string) => {
      const map: Record<string, string> = {
        SMTP_FROM: 'noreply@test.app',
        FRONTEND_URL: 'http://localhost:5173',
      };
      return map[key] ?? def ?? '';
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    (configMock.get as jest.Mock).mockImplementation(
      (key: string, def?: string) => {
        const map: Record<string, string> = {
          SMTP_FROM: 'noreply@test.app',
          FRONTEND_URL: 'http://localhost:5173',
        };
        return map[key] ?? def ?? '';
      },
    );
  });

  it('sends invite email via sendInternal when no transporter (dev mode)', async () => {
    const service = new EmailService(configMock, null, null);
    const url = await service.sendInviteEmail(
      'user@test.com',
      'Alice',
      'tok_abc',
    );
    expect(url).toContain('/auth/setup-password?token=tok_abc');
  });

  it('sends password reset via sendInternal when no transporter', async () => {
    const service = new EmailService(configMock, null, null);
    await expect(
      service.sendPasswordResetEmail('user@test.com', 'Bob', 'reset_tok'),
    ).resolves.toBeUndefined();
  });

  it('sends appointment reminder via sendInternal when no transporter', async () => {
    const service = new EmailService(configMock, null, null);
    await expect(
      service.sendAppointmentReminder(
        'patient@clinic.com',
        'Carol',
        new Date('2025-03-15'),
        '10:00',
      ),
    ).resolves.toBeUndefined();
  });

  it('enqueues when EmailQueueService is enabled', async () => {
    const mockEnqueue = jest.fn().mockResolvedValue('job-456');
    const mockQueue = {
      isEnabled: jest.fn().mockReturnValue(true),
      enqueueEmail: mockEnqueue,
    };

    const service = new EmailService(configMock, mockQueue as never, null);
    await service.sendInviteEmail('queued@test.com', 'Dave', 'tok_xyz');

    expect(mockEnqueue).toHaveBeenCalledWith('invite', {
      to: 'queued@test.com',
      name: 'Dave',
      token: 'tok_xyz',
    });
  });

  it('sends directly when EmailQueueService is disabled', async () => {
    const mockQueue = {
      isEnabled: jest.fn().mockReturnValue(false),
    };

    const service = new EmailService(configMock, mockQueue as never, null);
    const url = await service.sendInviteEmail(
      'direct@test.com',
      'Eve',
      'tok_direct',
    );
    expect(url).toContain('token=tok_direct');
  });

  it('throws when rate limit exceeded for recipient', async () => {
    (configMock.get as jest.Mock).mockImplementation(
      (key: string, def?: string) => {
        const map: Record<string, string> = {
          SMTP_FROM: 'noreply@test.app',
          FRONTEND_URL: 'http://localhost:5173',
          EMAIL_RATE_LIMIT_PER_RECIPIENT: '2',
        };
        return map[key] ?? def ?? '';
      },
    );

    const service = new EmailService(configMock, null, null);
    await service.sendInviteEmail('spam@test.com', 'A', 't1');
    await service.sendInviteEmail('spam@test.com', 'B', 't2');
    await expect(
      service.sendInviteEmail('spam@test.com', 'C', 't3'),
    ).rejects.toThrow(/rate limit exceeded/);
  });
});

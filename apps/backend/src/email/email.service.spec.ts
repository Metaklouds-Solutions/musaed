import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

const sendMailMock = jest.fn().mockResolvedValue(undefined);
const verifyMock = jest.fn().mockResolvedValue(undefined);
const transporterMock = {
  sendMail: sendMailMock,
  verify: verifyMock,
};
const createTransportSpy = jest
  .spyOn(nodemailer, 'createTransport')
  .mockReturnValue(transporterMock as never);

describe('EmailService', () => {
  const buildConfig = (overrides: Record<string, string> = {}) =>
    ({
      get: jest.fn((key: string, def?: string) => {
        const map: Record<string, string> = {
          SMTP_FROM: 'noreply@test.app',
          FRONTEND_URL: 'http://localhost:5173',
          NODE_ENV: 'development',
          ...overrides,
        };
        return map[key] ?? def ?? '';
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    createTransportSpy.mockReturnValue(transporterMock as never);
    sendMailMock.mockResolvedValue(undefined);
    verifyMock.mockResolvedValue(undefined);
  });

  it('sends invite email via sendInternal when no transporter (dev mode)', async () => {
    const service = new EmailService(buildConfig(), null, null);
    const url = await service.sendInviteEmail(
      'user@test.com',
      'Alice',
      'tok_abc',
    );
    expect(url).toContain('/auth/setup-password?token=tok_abc');
  });

  it('falls back from empty SMTP_PRIMARY_* values to SMTP_USER/PASS', async () => {
    const service = new EmailService(
      buildConfig({
        SMTP_PRIMARY_USER: '',
        SMTP_PRIMARY_PASS: '',
        SMTP_USER: 'smtp-user@test.app',
        SMTP_PASS: 'smtp-pass',
      }),
      null,
      null,
    );

    await service.sendInviteEmail('smtp@test.com', 'Fallback', 'tok_fallback');

    expect(createTransportSpy).toHaveBeenCalledTimes(1);
    expect(createTransportSpy).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'smtp-user@test.app', pass: 'smtp-pass' },
    });
    expect(sendMailMock).toHaveBeenCalled();
  });

  it('sends password reset via sendInternal when no transporter', async () => {
    const service = new EmailService(buildConfig(), null, null);
    await expect(
      service.sendPasswordResetEmail('user@test.com', 'Bob', 'reset_tok'),
    ).resolves.toBeUndefined();
  });

  it('sends appointment reminder via sendInternal when no transporter', async () => {
    const service = new EmailService(buildConfig(), null, null);
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

    const service = new EmailService(buildConfig(), mockQueue as never, null);
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

    const service = new EmailService(buildConfig(), mockQueue as never, null);
    const url = await service.sendInviteEmail(
      'direct@test.com',
      'Eve',
      'tok_direct',
    );
    expect(url).toContain('token=tok_direct');
  });

  it('fails hard in production when SMTP is not configured', async () => {
    const service = new EmailService(
      buildConfig({
        NODE_ENV: 'production',
        SMTP_PRIMARY_USER: '',
        SMTP_PRIMARY_PASS: '',
        SMTP_USER: '',
        SMTP_PASS: '',
      }),
      null,
      null,
    );

    await expect(
      service.sendInviteEmail('prod@test.com', 'Prod User', 'prod_tok'),
    ).rejects.toThrow(/SMTP is not configured/);
    expect(createTransportSpy).not.toHaveBeenCalled();
  });

  it('throws when rate limit exceeded for recipient', async () => {
    const service = new EmailService(
      buildConfig({
        EMAIL_RATE_LIMIT_PER_RECIPIENT: '2',
      }),
      null,
      null,
    );
    await service.sendInviteEmail('spam@test.com', 'A', 't1');
    await service.sendInviteEmail('spam@test.com', 'B', 't2');
    await expect(
      service.sendInviteEmail('spam@test.com', 'C', 't3'),
    ).rejects.toThrow(/rate limit exceeded/);
  });
});

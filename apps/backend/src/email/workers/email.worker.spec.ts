import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { EmailProcessor } from './email.worker';
import { EmailService } from '../email.service';
import { MetricsService } from '../../metrics/metrics.service';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;

  const mockSendInternalFromJob = jest.fn();
  const mockRecordEmailSent = jest.fn();
  const mockRecordEmailFailed = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailService,
          useValue: { sendInternalFromJob: mockSendInternalFromJob },
        },
        {
          provide: MetricsService,
          useValue: {
            recordEmailSent: mockRecordEmailSent,
            recordEmailFailed: mockRecordEmailFailed,
          },
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  it('processes invite job and calls sendInternalFromJob', async () => {
    mockSendInternalFromJob.mockResolvedValue(undefined);

    const job = {
      data: {
        type: 'invite',
        payload: {
          to: 'user@example.com',
          name: 'Alice',
          token: 'tok_123',
        },
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
      id: 'job-1',
    } as unknown as Job;

    await processor.process(job as never);

    expect(mockSendInternalFromJob).toHaveBeenCalledWith('invite', {
      to: 'user@example.com',
      name: 'Alice',
      token: 'tok_123',
    });
  });

  it('processes appointment_reminder job', async () => {
    mockSendInternalFromJob.mockResolvedValue(undefined);

    const job = {
      data: {
        type: 'appointment_reminder',
        payload: {
          to: 'patient@clinic.com',
          customerName: 'Bob',
          appointmentDate: '2025-03-15',
          timeSlot: '14:00',
        },
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
      id: 'job-2',
    } as unknown as Job;

    await processor.process(job as never);

    expect(mockSendInternalFromJob).toHaveBeenCalledWith(
      'appointment_reminder',
      {
        to: 'patient@clinic.com',
        customerName: 'Bob',
        appointmentDate: '2025-03-15',
        timeSlot: '14:00',
      },
    );
  });

  it('throws on sendInternalFromJob failure to trigger retry', async () => {
    mockSendInternalFromJob.mockRejectedValue(new Error('SMTP failed'));

    const job = {
      data: {
        type: 'password_reset',
        payload: { to: 'u@x.com', name: 'C', token: 't' },
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
      id: 'job-3',
    } as unknown as Job;

    await expect(processor.process(job as never)).rejects.toThrow(
      'SMTP failed',
    );
    expect(mockRecordEmailFailed).toHaveBeenCalledWith('password_reset');
  });
});

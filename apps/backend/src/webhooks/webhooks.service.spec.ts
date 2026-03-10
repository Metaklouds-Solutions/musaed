import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  const tenantModelMock = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };
  const agentModelMock = {
    findOne: jest.fn(),
  };
  const processedEventModelMock = {
    create: jest.fn(),
  };
  const callSessionModelMock = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  const configEnabled = {
    get: jest.fn().mockReturnValue('true'),
  } as unknown as ConfigService;

  let service: WebhooksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhooksService(
      configEnabled,
      tenantModelMock as never,
      agentModelMock as never,
      processedEventModelMock as never,
      callSessionModelMock as never,
    );
  });

  it('builds deterministic Retell event IDs', () => {
    const value = service.getRetellEventId({
      event: 'call_started',
      call_id: 'call_123',
    });
    expect(value).toBe('call_123:call_started');
  });

  it('upserts call session for call_started event', async () => {
    const tenantId = new Types.ObjectId();
    const agentId = new Types.ObjectId();
    callSessionModelMock.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    agentModelMock.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: agentId,
        tenantId,
        retellAgentId: 'retell_agent_1',
      }),
    });
    callSessionModelMock.updateOne.mockResolvedValue({ acknowledged: true });

    await service.handleRetellCallStarted({
      event: 'call_started',
      call_id: 'call_123',
      agent_id: 'retell_agent_1',
    });

    expect(callSessionModelMock.updateOne).toHaveBeenCalledWith(
      { callId: 'call_123' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          callId: 'call_123',
          tenantId,
          agentInstanceId: agentId,
        }),
        $set: expect.objectContaining({ status: 'started' }),
      }),
      { upsert: true },
    );
  });

  it('skips call ingestion when feature flag is disabled', async () => {
    const disabledService = new WebhooksService(
      {
        get: jest.fn().mockReturnValue('false'),
      } as unknown as ConfigService,
      tenantModelMock as never,
      agentModelMock as never,
      processedEventModelMock as never,
      callSessionModelMock as never,
    );

    await disabledService.handleRetellCallStarted({
      event: 'call_started',
      call_id: 'call_123',
      agent_id: 'retell_agent_1',
    });

    expect(callSessionModelMock.updateOne).not.toHaveBeenCalled();
  });
});


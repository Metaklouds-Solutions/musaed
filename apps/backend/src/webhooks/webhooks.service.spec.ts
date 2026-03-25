import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  const agentDeploymentsServiceMock = {
    findActiveByRetellAgentId: jest.fn().mockResolvedValue(null),
  };
  const tenantModelMock = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };
  const processedEventModelMock = {
    create: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
  };
  const callSessionModelMock = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };
  const runModelMock = {
    findOneAndUpdate: jest.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
    }),
  };
  const runEventModelMock = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const configEnabled = {
    get: jest.fn().mockReturnValue('true'),
  } as unknown as ConfigService;

  let service: WebhooksService;

  beforeEach(() => {
    jest.clearAllMocks();
    agentDeploymentsServiceMock.findActiveByRetellAgentId.mockResolvedValue(
      null,
    );
    service = new WebhooksService(
      configEnabled,
      agentDeploymentsServiceMock as never,
      tenantModelMock as never,
      processedEventModelMock as never,
      callSessionModelMock as never,
      runModelMock as never,
      runEventModelMock as never,
    );
  });

  it('builds deterministic Retell event IDs', () => {
    const value = service.getRetellEventId({
      event: 'call_started',
      call_id: 'call_123',
    });
    expect(value).toBe('call_123-call_started');
  });

  it('upserts call session for call_started event', async () => {
    const tenantId = new Types.ObjectId();
    const agentId = new Types.ObjectId();
    callSessionModelMock.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    agentDeploymentsServiceMock.findActiveByRetellAgentId.mockResolvedValue({
      _id: new Types.ObjectId(),
      tenantId,
      agentInstanceId: agentId,
      retellAgentId: 'retell_agent_1',
      channel: 'voice',
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
      agentDeploymentsServiceMock as never,
      tenantModelMock as never,
      processedEventModelMock as never,
      callSessionModelMock as never,
      runModelMock as never,
      runEventModelMock as never,
    );

    await disabledService.handleRetellCallStarted({
      event: 'call_started',
      call_id: 'call_123',
      agent_id: 'retell_agent_1',
    });

    expect(callSessionModelMock.updateOne).not.toHaveBeenCalled();
  });

  describe('webhook event ordering protection', () => {
    const tenantId = new Types.ObjectId();
    const agentId = new Types.ObjectId();

    beforeEach(() => {
      agentDeploymentsServiceMock.findActiveByRetellAgentId.mockResolvedValue({
        _id: new Types.ObjectId(),
        tenantId,
        agentInstanceId: agentId,
        retellAgentId: 'retell_agent_1',
        channel: 'voice',
      });
      callSessionModelMock.updateOne.mockResolvedValue({ acknowledged: true });
    });

    function mockFindOneChain(
      result: {
        _id?: unknown;
        status?: string;
        metadata?: Record<string, unknown>;
      } | null,
    ) {
      return {
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(result),
        }),
      };
    }

    it('allows normal order: started → ended → analyzed', async () => {
      callSessionModelMock.findOne
        .mockReturnValueOnce(mockFindOneChain(null))
        .mockReturnValueOnce(
          mockFindOneChain({ _id: 1, status: 'started', metadata: {} }),
        )
        .mockReturnValueOnce(
          mockFindOneChain({ _id: 1, status: 'ended', metadata: {} }),
        );

      await service.handleRetellCallStarted({
        event: 'call_started',
        call_id: 'call_abc',
        agent_id: 'retell_agent_1',
      });
      await service.handleRetellCallEnded({
        event: 'call_ended',
        call_id: 'call_abc',
        agent_id: 'retell_agent_1',
        duration_ms: 120,
      });
      await service.handleRetellCallAnalyzed({
        event: 'call_analyzed',
        call_id: 'call_abc',
        agent_id: 'retell_agent_1',
        summary: 'Booked',
        sentiment: 'positive',
      });

      expect(callSessionModelMock.updateOne).toHaveBeenCalledTimes(3);
      const lastUpdate = callSessionModelMock.updateOne.mock.calls[2][1];
      expect(lastUpdate.$set).toMatchObject({ status: 'analyzed' });
    });

    it('skips out-of-order event: analyzed then ended (ended is stale)', async () => {
      callSessionModelMock.findOne
        .mockReturnValueOnce(mockFindOneChain(null))
        .mockReturnValueOnce(
          mockFindOneChain({ _id: 1, status: 'started', metadata: {} }),
        )
        .mockReturnValueOnce(
          mockFindOneChain({ _id: 1, status: 'ended', metadata: {} }),
        )
        .mockReturnValueOnce(
          mockFindOneChain({ _id: 1, status: 'analyzed', metadata: {} }),
        );

      await service.handleRetellCallStarted({
        event: 'call_started',
        call_id: 'call_xyz',
        agent_id: 'retell_agent_1',
      });
      await service.handleRetellCallEnded({
        event: 'call_ended',
        call_id: 'call_xyz',
        agent_id: 'retell_agent_1',
        duration_ms: 90,
      });
      await service.handleRetellCallAnalyzed({
        event: 'call_analyzed',
        call_id: 'call_xyz',
        agent_id: 'retell_agent_1',
        summary: 'Done',
        sentiment: 'neutral',
      });
      callSessionModelMock.updateOne.mockClear();
      await service.handleRetellCallEnded({
        event: 'call_ended',
        call_id: 'call_xyz',
        agent_id: 'retell_agent_1',
        duration_ms: 90,
      });

      expect(callSessionModelMock.updateOne).not.toHaveBeenCalled();
    });

    it('skips duplicate status: second call_ended when already ended', async () => {
      callSessionModelMock.findOne.mockReturnValue(
        mockFindOneChain({ _id: 1, status: 'ended', metadata: {} }),
      );

      await service.handleRetellCallEnded({
        event: 'call_ended',
        call_id: 'call_dup',
        agent_id: 'retell_agent_1',
        duration_ms: 60,
      });

      expect(callSessionModelMock.updateOne).not.toHaveBeenCalled();
    });

    it('skips when incoming timestamp is older than lastEventTimestamp', async () => {
      const newerTs = 1700000000000;
      const olderTs = 1699999999000;
      callSessionModelMock.findOne.mockReturnValue(
        mockFindOneChain({
          _id: 1,
          status: 'started',
          metadata: { lastEventTimestamp: newerTs },
        }),
      );

      await service.handleRetellCallEnded({
        event: 'call_ended',
        call_id: 'call_ts',
        agent_id: 'retell_agent_1',
        duration_ms: 45,
        metadata: { timestamp: olderTs },
      });

      expect(callSessionModelMock.updateOne).not.toHaveBeenCalled();
    });

    it('allows update when incoming timestamp is newer', async () => {
      const olderTs = 1699999999000;
      const newerTs = 1700000000000;
      callSessionModelMock.findOne.mockReturnValue(
        mockFindOneChain({
          _id: 1,
          status: 'started',
          metadata: { lastEventTimestamp: olderTs },
        }),
      );

      await service.handleRetellCallEnded({
        event: 'call_ended',
        call_id: 'call_ts_new',
        agent_id: 'retell_agent_1',
        duration_ms: 45,
        metadata: { timestamp: newerTs },
      });

      expect(callSessionModelMock.updateOne).toHaveBeenCalled();
    });
  });
});

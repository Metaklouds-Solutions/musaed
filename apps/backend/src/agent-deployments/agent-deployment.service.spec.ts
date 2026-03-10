import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentDeploymentService } from './agent-deployment.service';

function createMockAgentInstance(overrides?: Partial<Record<string, unknown>>) {
  const instance = {
    _id: new Types.ObjectId(),
    tenantId: new Types.ObjectId(),
    templateId: new Types.ObjectId(),
    channelsEnabled: ['chat'],
    channel: 'chat',
    name: 'Agent',
    status: 'paused',
    deployedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return instance;
}

describe('AgentDeploymentService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks deployment as failed when template is missing', async () => {
    const instance = createMockAgentInstance();
    const agentInstanceModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(instance),
      findById: jest.fn().mockResolvedValue(instance),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const agentTemplateModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new AgentDeploymentService(
      agentInstanceModel as never,
      agentTemplateModel as never,
      {
        upsertByChannel: jest.fn(),
      } as never,
      {
        createConversationFlow: jest.fn(),
      } as never,
      {
        getOrThrow: jest.fn().mockReturnValue('http://localhost:3001'),
        get: jest.fn(),
      } as never,
      {
        log: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        record: jest.fn(),
      } as never,
    );

    await expect(service.deployAgentInstance(instance._id.toString())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(agentInstanceModel.updateOne).toHaveBeenCalledWith(
      { _id: instance._id, status: 'deploying' },
      { $set: { status: 'failed' } },
    );
  });

  it('deploys chat channel and marks instance active', async () => {
    const instance = createMockAgentInstance();
    const agentInstanceModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(instance),
      findById: jest.fn().mockResolvedValue(instance),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const agentTemplateModel = {
      findOne: jest.fn().mockResolvedValue({
        flowTemplate: {
          conversationFlow: {
            nodes: [],
            tools: [],
          },
          response_engine: { version: 1 },
        },
      }),
    };
    const upsertByChannel = jest.fn().mockResolvedValue(undefined);
    const service = new AgentDeploymentService(
      agentInstanceModel as never,
      agentTemplateModel as never,
      {
        upsertByChannel,
      } as never,
      {
        createConversationFlow: jest
          .fn()
          .mockResolvedValue({ conversation_flow_id: 'flow_123' }),
        createChatAgent: jest.fn().mockResolvedValue({ agent_id: 'agent_123' }),
      } as never,
      {
        getOrThrow: jest.fn().mockReturnValue('http://localhost:3001'),
        get: jest.fn(),
      } as never,
      {
        log: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        record: jest.fn(),
      } as never,
    );

    const result = await service.deployAgentInstance(instance._id.toString());

    expect(result.overallStatus).toBe('active');
    expect(instance.status).toBe('active');
    expect(instance.save).toHaveBeenCalledTimes(1);
    expect(upsertByChannel).toHaveBeenCalled();
  });
});

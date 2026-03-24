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

function createConfigMock(apiBaseUrl?: string) {
  return {
    getOrThrow: jest.fn().mockReturnValue(apiBaseUrl ?? 'http://localhost:3001'),
    get: jest.fn((key: string, def?: string) => {
      if (key === 'API_BASE_URL') {
        return apiBaseUrl ?? def;
      }
      if (key === 'RETELL_TOOL_API_KEY') {
        return 'test-retell-tool-key';
      }
      if (key === 'NODE_ENV') {
        return 'development';
      }
      return def;
    }),
  };
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
        ...createConfigMock('http://localhost:3001'),
      } as never,
      {
        log: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        record: jest.fn(),
      } as never,
    );

    await expect(
      service.deployAgentInstance(instance._id.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
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
        deleteAgent: jest.fn().mockResolvedValue({ success: true }),
        deleteConversationFlow: jest.fn().mockResolvedValue({ success: true }),
      } as never,
      {
        ...createConfigMock('http://localhost:3001'),
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

  it('deploys direct retell-llm template without creating a conversation flow', async () => {
    const instance = createMockAgentInstance({
      channelsEnabled: ['voice'],
      channel: 'voice',
    });
    const agentInstanceModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(instance),
      findById: jest.fn().mockResolvedValue(instance),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const agentTemplateModel = {
      findOne: jest.fn().mockResolvedValue({
        flowTemplate: {
          response_engine: {
            type: 'retell-llm',
            llm_id: 'llm_123',
            version: 0,
          },
          voice_id: '11labs-Maren',
          language: 'en-US',
        },
      }),
    };
    const createConversationFlow = jest.fn();
    const createAgent = jest
      .fn()
      .mockResolvedValue({ agent_id: 'agent_voice_123' });
    const service = new AgentDeploymentService(
      agentInstanceModel as never,
      agentTemplateModel as never,
      {
        upsertByChannel: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createConversationFlow,
        createAgent,
        deleteAgent: jest.fn().mockResolvedValue({ success: true }),
        deleteConversationFlow: jest.fn().mockResolvedValue({ success: true }),
      } as never,
      {
        ...createConfigMock('http://localhost:3001'),
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
    expect(createConversationFlow).not.toHaveBeenCalled();
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_name: expect.stringContaining('-voice'),
        response_engine: expect.objectContaining({
          type: 'retell-llm',
          llm_id: 'llm_123',
        }),
        voice_id: '11labs-Maren',
      }),
    );
  });

  it('falls back to localhost API base URL when API_BASE_URL is missing', async () => {
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
            tools: [
              {
                name: 'get_agent_config',
                url: '{{API_BASE_URL}}/agents/tools/get_agent_config',
              },
            ],
          },
          response_engine: { version: 1 },
        },
      }),
    };
    const createConversationFlow = jest
      .fn()
      .mockResolvedValue({ conversation_flow_id: 'flow_456' });
    const service = new AgentDeploymentService(
      agentInstanceModel as never,
      agentTemplateModel as never,
      {
        upsertByChannel: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        createConversationFlow,
        createChatAgent: jest.fn().mockResolvedValue({ agent_id: 'agent_456' }),
        deleteAgent: jest.fn().mockResolvedValue({ success: true }),
        deleteConversationFlow: jest.fn().mockResolvedValue({ success: true }),
      } as never,
      {
        ...createConfigMock(),
      } as never,
      {
        log: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        record: jest.fn(),
      } as never,
    );

    await service.deployAgentInstance(instance._id.toString());

    expect(createConversationFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.arrayContaining([
          expect.objectContaining({
            url: 'http://localhost:3001/api/agents/tools/get_agent_config',
          }),
        ]),
      }),
    );
  });

  it.each([
    ['http://localhost:3001', 'http://localhost:3001/api/agents/tools/get_available_slots'],
    [
      'http://localhost:3001/api',
      'http://localhost:3001/api/agents/tools/get_available_slots',
    ],
  ])(
    'injects standard booking tool URLs when API_BASE_URL is %s',
    async (apiBaseUrl, expectedUrl) => {
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
      const createConversationFlow = jest
        .fn()
        .mockResolvedValue({ conversation_flow_id: 'flow_standard' });
      const service = new AgentDeploymentService(
        agentInstanceModel as never,
        agentTemplateModel as never,
        {
          upsertByChannel: jest.fn().mockResolvedValue(undefined),
        } as never,
        {
          createConversationFlow,
          createChatAgent: jest
            .fn()
            .mockResolvedValue({ agent_id: 'agent_standard' }),
          deleteAgent: jest.fn().mockResolvedValue({ success: true }),
          deleteConversationFlow: jest.fn().mockResolvedValue({ success: true }),
        } as never,
        {
          ...createConfigMock(apiBaseUrl),
        } as never,
        {
          log: jest.fn().mockResolvedValue(undefined),
        } as never,
        {
          record: jest.fn(),
        } as never,
      );

      await service.deployAgentInstance(instance._id.toString());

      expect(createConversationFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({
              name: 'get_available_slots',
              url: expectedUrl,
            }),
          ]),
        }),
      );
    },
  );
});

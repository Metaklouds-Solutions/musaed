import { Types } from 'mongoose';
import { AgentDeploymentService } from './agent-deployment.service';

describe('AgentDeploymentService integration', () => {
  it('deploys mixed channels and returns partially_deployed with mocked Retell API', async () => {
    const instance = {
      _id: new Types.ObjectId(),
      tenantId: new Types.ObjectId(),
      templateId: new Types.ObjectId(),
      channelsEnabled: ['chat', 'voice'],
      channel: 'chat',
      name: 'Integration Agent',
      status: 'paused',
      deployedAt: null,
      save: jest.fn().mockResolvedValue(undefined),
    };

    const retellClient = {
      createConversationFlow: jest
        .fn()
        .mockResolvedValueOnce({ conversation_flow_id: 'flow_chat' })
        .mockResolvedValueOnce({ conversation_flow_id: 'flow_voice' }),
      createChatAgent: jest.fn().mockResolvedValue({ agent_id: 'chat_agent' }),
      createAgent: jest
        .fn()
        .mockRejectedValue(new Error('voice provider down')),
      deleteConversationFlow: jest.fn().mockResolvedValue({ success: true }),
      deleteAgent: jest.fn().mockResolvedValue({ success: true }),
    };

    const service = new AgentDeploymentService(
      {
        findOneAndUpdate: jest.fn().mockResolvedValue(instance),
        findById: jest.fn().mockResolvedValue(instance),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      } as never,
      {
        findOne: jest.fn().mockResolvedValue({
          flowTemplate: {
            conversationFlow: {
              nodes: [],
              tools: [],
            },
            response_engine: { version: 1 },
            voice_id: 'voice_123',
          },
        }),
      } as never,
      {
        upsertByChannel: jest.fn().mockResolvedValue(undefined),
      } as never,
      retellClient as never,
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

    expect(result.overallStatus).toBe('partially_deployed');
    expect(result.channels).toHaveLength(2);
    expect(retellClient.createConversationFlow).toHaveBeenCalledTimes(2);
    expect(retellClient.deleteConversationFlow).toHaveBeenCalledWith(
      'flow_voice',
    );
  });
});

import { BadRequestException } from '@nestjs/common';
import { processFlowTemplate } from './flow-processor';

describe('flow-processor', () => {
  it('replaces nested placeholders and injects dynamic variables', () => {
    const source = {
      conversationFlow: {
        nodes: [
          {
            id: 'n1',
            prompt: 'Tenant {{tenantId}} agent {{agentInstanceId}}',
          },
        ],
        tools: [
          {
            name: 'get_agent_config',
            url: '{{API_BASE_URL}}/agents/tools/get_agent_config',
          },
        ],
      },
      response_engine: { version: 2 },
    } as Record<string, unknown>;

    const result = processFlowTemplate(source, {
      tenantId: 'tenant_123',
      agentInstanceId: 'agent_456',
      apiBaseUrl: 'http://localhost:3001',
    });

    const conversationFlow = result.conversationFlow as Record<string, unknown>;
    const nodes = conversationFlow.nodes as Array<Record<string, unknown>>;
    const tools = conversationFlow.tools as Array<Record<string, unknown>>;
    const defaults = conversationFlow.default_dynamic_variables as Record<string, unknown>;

    expect(nodes[0].prompt).toBe('Tenant tenant_123 agent agent_456');
    expect(tools[0].url).toBe('http://localhost:3001/api/agents/tools/get_agent_config');
    expect(defaults.tenant_id).toBe('tenant_123');
    expect(defaults.agent_instance_id).toBe('agent_456');
  });

  it('throws for malformed flow payload', () => {
    const source = {
      conversationFlow: {
        nodes: [],
      },
      response_engine: { version: 1 },
    } as Record<string, unknown>;

    expect(() =>
      processFlowTemplate(source, {
        tenantId: 'tenant_123',
        agentInstanceId: 'agent_456',
        apiBaseUrl: 'http://localhost:3001',
      }),
    ).toThrow(BadRequestException);
  });
});

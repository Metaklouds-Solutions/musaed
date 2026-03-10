import { ConfigService } from '@nestjs/config';
import { RetellClient } from './retell.client';
import { RetellApiException } from './retell.errors';
import { APIError } from 'retell-sdk';

describe('RetellClient', () => {
  let client: RetellClient;

  beforeEach(() => {
    client = new RetellClient({
      getOrThrow: jest.fn().mockReturnValue('retell_test_key'),
    } as unknown as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws RetellApiException on SDK APIError', async () => {
    // Mock the SDK's agent.create method to throw an APIError
    const mockError = new APIError(400, { message: 'bad request' }, 'bad request', undefined);
    jest.spyOn((client as any).client.agent, 'create').mockRejectedValue(mockError);

    await expect(
      client.createAgent({
        agent_name: 'Test',
      }),
    ).rejects.toBeInstanceOf(RetellApiException);
  });

  it('successfully creates an agent', async () => {
    jest.spyOn((client as any).client.agent, 'create').mockResolvedValue({
      agent_id: 'agent_1',
    });

    const result = await client.createAgent({
      agent_name: 'Test',
    });
    expect(result.agent_id).toBe('agent_1');
  });

  it('successfully probes connectivity', async () => {
    jest.spyOn((client as any).client.agent, 'list').mockResolvedValue([]);

    const result = await client.probeConnectivity();
    expect(result.reachable).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('handles probe connectivity failure', async () => {
    const mockError = new APIError(401, { message: 'unauthorized' }, 'unauthorized', undefined);
    jest.spyOn((client as any).client.agent, 'list').mockRejectedValue(mockError);

    const result = await client.probeConnectivity();
    expect(result.reachable).toBe(false);
    expect(result.statusCode).toBe(401);
  });
});
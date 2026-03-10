import { ConfigService } from '@nestjs/config';
import { RetellClient } from './retell.client';
import { RetellApiException } from './retell.errors';

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

  it('throws RetellApiException on non-retriable 4xx response', async () => {
    const mockJson = jest.fn().mockResolvedValue({ message: 'bad request' });
    const mockResponse = {
      ok: false,
      status: 400,
      json: mockJson,
    } as unknown as Response;
    global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

    await expect(
      client.createChatAgent({
        agent_name: 'Test',
      }),
    ).rejects.toBeInstanceOf(RetellApiException);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries retriable errors and eventually succeeds', async () => {
    jest.spyOn(client as never, 'wait').mockResolvedValue(undefined);
    const failingResponse = {
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'server error' }),
    } as unknown as Response;
    const successResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ conversation_flow_id: 'flow_1' }),
    } as unknown as Response;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(failingResponse)
      .mockResolvedValueOnce(successResponse) as unknown as typeof fetch;

    const result = await client.createConversationFlow({
      nodes: [],
    });
    expect(result.conversation_flow_id).toBe('flow_1');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

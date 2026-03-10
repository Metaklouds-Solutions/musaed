import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RETELL_API_BASE_URL,
  RETELL_DEFAULT_TIMEOUT_MS,
  RETELL_RETRY_ATTEMPTS,
  RETELL_RETRY_BASE_DELAY_MS,
} from './retell.constants';
import { RetellApiException } from './retell.errors';

type JsonRecord = Record<string, unknown>;

interface RetellFlowResponse {
  conversation_flow_id: string;
}

interface RetellAgentResponse {
  agent_id: string;
}

interface RetellDeleteResponse {
  success?: boolean;
}

interface RetellConnectivityResult {
  reachable: boolean;
  statusCode: number | null;
}

/**
 * Retell HTTP client with timeout and retry for transient errors.
 */
@Injectable()
export class RetellClient {
  private readonly logger = new Logger(RetellClient.name);
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('RETELL_API_KEY');
    this.timeoutMs = RETELL_DEFAULT_TIMEOUT_MS;
  }

  /**
   * Creates a Retell conversation flow and returns its identifier.
   */
  async createConversationFlow(flow: JsonRecord): Promise<RetellFlowResponse> {
    return this.requestWithRetry<RetellFlowResponse>('/create-conversation-flow', {
      method: 'POST',
      body: flow,
    });
  }

  /**
   * Creates a Retell chat agent for chat/email channels.
   */
  async createChatAgent(payload: JsonRecord): Promise<RetellAgentResponse> {
    return this.requestWithRetry<RetellAgentResponse>('/create-chat-agent', {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Creates a Retell voice agent.
   */
  async createAgent(payload: JsonRecord): Promise<RetellAgentResponse> {
    return this.requestWithRetry<RetellAgentResponse>('/create-agent', {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Deletes a Retell agent if provider cleanup is required.
   */
  async deleteAgent(agentId: string): Promise<RetellDeleteResponse> {
    return this.requestWithRetry<RetellDeleteResponse>('/delete-agent', {
      method: 'POST',
      body: { agent_id: agentId },
    });
  }

  /**
   * Deletes a Retell conversation flow if provider cleanup is required.
   */
  async deleteConversationFlow(conversationFlowId: string): Promise<RetellDeleteResponse> {
    return this.requestWithRetry<RetellDeleteResponse>('/delete-conversation-flow', {
      method: 'POST',
      body: { conversation_flow_id: conversationFlowId },
    });
  }

  /**
   * Probes Retell API network reachability for health checks.
   */
  async probeConnectivity(): Promise<RetellConnectivityResult> {
    try {
      const response = await this.executeRequest('/create-agent', { method: 'GET' });
      return {
        reachable: true,
        statusCode: response.status,
      };
    } catch (error: unknown) {
      this.logger.warn(`Retell connectivity probe failed: ${this.getErrorMessage(error)}`);
      return {
        reachable: false,
        statusCode: null,
      };
    }
  }

  private async requestWithRetry<TResponse>(
    path: string,
    options: { method: 'POST' | 'GET'; body?: JsonRecord },
  ): Promise<TResponse> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= RETELL_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const response = await this.executeRequest(path, options);
        if (!response.ok) {
          const body = await this.safeJson(response);
          const retriable = this.isRetriableStatus(response.status);
          const message = `Retell request failed: ${response.status}`;
          this.logger.warn(
            `${message} path=${path} attempt=${attempt} retriable=${retriable}`,
          );
          if (!retriable || attempt === RETELL_RETRY_ATTEMPTS) {
            throw new RetellApiException(
              message,
              this.mapHttpStatus(response.status),
              retriable,
              { path, status: response.status, body: body ?? null },
            );
          }
          await this.wait(this.getBackoffDelay(attempt));
          continue;
        }
        return (await response.json()) as TResponse;
      } catch (error: unknown) {
        lastError = error;
        if (error instanceof RetellApiException) {
          if (!error.retriable || attempt === RETELL_RETRY_ATTEMPTS) {
            throw error;
          }
          await this.wait(this.getBackoffDelay(attempt));
          continue;
        }
        const retriable = true;
        this.logger.warn(`Retell request error path=${path} attempt=${attempt}`);
        if (!retriable || attempt === RETELL_RETRY_ATTEMPTS) {
          throw new RetellApiException(
            'Retell request failed',
            HttpStatus.BAD_GATEWAY,
            retriable,
            { path, reason: this.getErrorMessage(error) },
          );
        }
        await this.wait(this.getBackoffDelay(attempt));
      }
    }

    throw new RetellApiException(
      'Retell request failed after retries',
      HttpStatus.BAD_GATEWAY,
      false,
      { reason: this.getErrorMessage(lastError) },
    );
  }

  private async executeRequest(
    path: string,
    options: { method: 'POST' | 'GET'; body?: JsonRecord },
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(`${RETELL_API_BASE_URL}${path}`, {
        method: options.method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private isRetriableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private mapHttpStatus(retellStatus: number): number {
    if (retellStatus === 401 || retellStatus === 403) {
      return HttpStatus.BAD_GATEWAY;
    }
    if (retellStatus === 404) {
      return HttpStatus.BAD_GATEWAY;
    }
    if (retellStatus === 429) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }
    if (retellStatus >= 400 && retellStatus < 500) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.BAD_GATEWAY;
  }

  private getBackoffDelay(attempt: number): number {
    return RETELL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Retell, { APIError } from 'retell-sdk';
import { RETELL_RETRY_ATTEMPTS } from './retell.constants';
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
 * Retell HTTP client wrapping the official retell-sdk.
 */
@Injectable()
export class RetellClient {
  private readonly logger = new Logger(RetellClient.name);
  private readonly client: Retell;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('RETELL_API_KEY');
    this.client = new Retell({
      apiKey,
      maxRetries: RETELL_RETRY_ATTEMPTS,
    });
  }

  /**
   * Creates a Retell conversation flow and returns its identifier.
   */
  async createConversationFlow(flow: JsonRecord): Promise<RetellFlowResponse> {
    try {
      const response = await this.client.conversationFlow.create(flow as any);
      return { conversation_flow_id: response.conversation_flow_id };
    } catch (error) {
      throw this.handleError(error, 'createConversationFlow');
    }
  }

  /**
   * Creates a Retell chat agent for chat/email channels.
   */
  async createChatAgent(payload: JsonRecord): Promise<RetellAgentResponse> {
    try {
      const response = await this.client.chatAgent.create(payload as any);
      return { agent_id: response.agent_id };
    } catch (error) {
      throw this.handleError(error, 'createChatAgent');
    }
  }

  /**
   * Creates a Retell voice agent.
   */
  async createAgent(payload: JsonRecord): Promise<RetellAgentResponse> {
    try {
      const response = await this.client.agent.create(payload as any);
      return { agent_id: response.agent_id };
    } catch (error) {
      throw this.handleError(error, 'createAgent');
    }
  }

  /**
   * Deletes a Retell agent if provider cleanup is required.
   */
  async deleteAgent(agentId: string): Promise<RetellDeleteResponse> {
    try {
      await this.client.agent.delete(agentId);
      return { success: true };
    } catch (error) {
      throw this.handleError(error, 'deleteAgent');
    }
  }

  /**
   * Deletes a Retell conversation flow if provider cleanup is required.
   */
  async deleteConversationFlow(conversationFlowId: string): Promise<RetellDeleteResponse> {
    try {
      await this.client.conversationFlow.delete(conversationFlowId);
      return { success: true };
    } catch (error) {
      throw this.handleError(error, 'deleteConversationFlow');
    }
  }

  /**
   * Retrieves a specific call by its ID.
   */
  async getCall(callId: string) {
    try {
      return await this.client.call.retrieve(callId);
    } catch (error) {
      throw this.handleError(error, 'getCall');
    }
  }

  /**
   * Updates call metadata or flags.
   */
  async updateCall(callId: string, payload: any) {
    try {
      return await this.client.call.update(callId, payload);
    } catch (error) {
      throw this.handleError(error, 'updateCall');
    }
  }

  /**
   * Lists calls matching given criteria.
   */
  async listCalls(filterCriteria?: JsonRecord) {
    try {
      return await this.client.call.list(filterCriteria as any);
    } catch (error) {
      throw this.handleError(error, 'listCalls');
    }
  }

  /**
   * Creates a new web call, returning the call ID and access token.
   */
  async createWebCall(payload: { agent_id: string; metadata?: any }) {
    try {
      return await this.client.call.createWebCall(payload);
    } catch (error) {
      throw this.handleError(error, 'createWebCall');
    }
  }

  /**
   * Retrieves a voice agent by ID.
   */
  async getAgent(agentId: string) {
    try {
      return await this.client.agent.retrieve(agentId);
    } catch (error) {
      throw this.handleError(error, 'getAgent');
    }
  }

  /**
   * Retrieves a chat agent by ID.
   */
  async getChatAgent(agentId: string) {
    try {
      return await this.client.chatAgent.retrieve(agentId);
    } catch (error) {
      throw this.handleError(error, 'getChatAgent');
    }
  }

  /**
   * Creates a new chat.
   */
  async createChat(payload: { agent_id: string; metadata?: any }) {
    try {
      return await this.client.chat.create(payload);
    } catch (error) {
      throw this.handleError(error, 'createChat');
    }
  }

  /**
   * Retrieves a chat by ID.
   */
  async getChat(chatId: string) {
    try {
      return await this.client.chat.retrieve(chatId);
    } catch (error) {
      throw this.handleError(error, 'getChat');
    }
  }

  /**
   * Lists chats matching given criteria.
   */
  async listChats(filterCriteria?: JsonRecord) {
    try {
      return await this.client.chat.list(filterCriteria as any);
    } catch (error) {
      throw this.handleError(error, 'listChats');
    }
  }

  /**
   * Creates a chat completion (sends user message to Retell chat).
   * Retell API expects { chat_id, content }.
   */
  async createChatCompletion(chatId: string, content: string) {
    try {
      return await this.client.chat.createChatCompletion({
        chat_id: chatId,
        content,
      });
    } catch (error) {
      throw this.handleError(error, 'createChatCompletion');
    }
  }

  /**
   * Probes Retell API network reachability for health checks.
   */
  async probeConnectivity(): Promise<RetellConnectivityResult> {
    try {
      await this.client.agent.list();
      return {
        reachable: true,
        statusCode: 200,
      };
    } catch (error: unknown) {
      this.logger.warn(`Retell connectivity probe failed: ${this.getErrorMessage(error)}`);
      return {
        reachable: false,
        statusCode: error instanceof APIError ? error.status : null,
      };
    }
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof APIError) {
      const status = error.status || 500;
      const isRetriable = status === 429 || status >= 500;
      
      this.logger.error(`Retell SDK Error in ${context}: ${error.message}`, error.stack);
      
      throw new RetellApiException(
        `Retell API error: ${error.message}`,
        this.mapHttpStatus(status),
        isRetriable,
        {
          status,
          body: error.error,
          context,
        }
      );
    }

    this.logger.error(`Unexpected error in ${context}: ${this.getErrorMessage(error)}`);
    throw new RetellApiException(
      'Unexpected Retell request failure',
      HttpStatus.INTERNAL_SERVER_ERROR,
      false,
      { context, reason: this.getErrorMessage(error) }
    );
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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
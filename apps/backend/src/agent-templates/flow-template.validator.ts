import { BadRequestException } from '@nestjs/common';

export type Channel = 'voice' | 'chat' | 'email';

const VALID_CHANNELS: Channel[] = ['voice', 'chat', 'email'];
const CHANNEL_PRIORITY: Channel[] = ['chat', 'voice', 'email'];

function isChannel(value: string): value is Channel {
  return value === 'voice' || value === 'chat' || value === 'email';
}

/**
 * Validates supported channels and normalizes order/uniqueness.
 */
export function normalizeSupportedChannels(rawChannels: string[]): Channel[] {
  const normalized: Channel[] = [];
  for (const channel of rawChannels) {
    if (!isChannel(channel)) {
      throw new BadRequestException(
        `Unsupported channel "${channel}" in template payload`,
      );
    }
    if (!normalized.includes(channel)) {
      normalized.push(channel);
    }
  }
  if (normalized.length === 0) {
    throw new BadRequestException(
      'supportedChannels must contain at least one channel',
    );
  }
  return normalized;
}

/**
 * Picks a deterministic default channel from supported channels.
 */
export function selectDefaultChannel(channels: Channel[]): Channel {
  for (const channel of CHANNEL_PRIORITY) {
    if (channels.includes(channel)) {
      return channel;
    }
  }
  return channels[0];
}

/**
 * Deep validation for Retell flow template payload shape.
 */
export function validateFlowTemplateForChannels(
  flowTemplate: Record<string, unknown>,
  channels: Channel[],
): void {
  if (
    !flowTemplate ||
    typeof flowTemplate !== 'object' ||
    Array.isArray(flowTemplate)
  ) {
    throw new BadRequestException('flowTemplate must be a non-array object');
  }
  const responseEngine = getRecord(flowTemplate.response_engine);
  const responseEngineType =
    typeof responseEngine?.type === 'string' ? responseEngine.type : null;
  const conversationFlow = getRecord(flowTemplate.conversationFlow);

  if (responseEngineType === 'conversation-flow' || conversationFlow) {
    if (!conversationFlow) {
      throw new BadRequestException(
        'flowTemplate.conversationFlow is required',
      );
    }
    if (!Array.isArray(conversationFlow.nodes)) {
      throw new BadRequestException(
        'flowTemplate.conversationFlow.nodes must be an array',
      );
    }
    if (conversationFlow.nodes.length === 0) {
      throw new BadRequestException(
        'flowTemplate.conversationFlow.nodes must not be empty',
      );
    }
    if (!Array.isArray(conversationFlow.tools)) {
      throw new BadRequestException(
        'flowTemplate.conversationFlow.tools must be an array',
      );
    }
    if (
      conversationFlow.start_speaker != null &&
      typeof conversationFlow.start_speaker !== 'string'
    ) {
      throw new BadRequestException(
        'flowTemplate.conversationFlow.start_speaker must be a string',
      );
    }
  } else if (
    !responseEngine ||
    typeof responseEngineType !== 'string' ||
    responseEngineType.length === 0
  ) {
    throw new BadRequestException(
      'flowTemplate.response_engine.type is required for non-conversation templates',
    );
  }

  if (channels.includes('voice')) {
    const voiceId = flowTemplate.voice_id;
    if (typeof voiceId !== 'string' || voiceId.trim().length === 0) {
      throw new BadRequestException(
        'flowTemplate.voice_id is required for voice channel',
      );
    }
  }
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

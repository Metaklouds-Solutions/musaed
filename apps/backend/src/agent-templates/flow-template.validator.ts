import { BadRequestException } from '@nestjs/common';

type Channel = 'voice' | 'chat' | 'email';

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
      throw new BadRequestException(`Unsupported channel "${channel}" in template payload`);
    }
    if (!normalized.includes(channel)) {
      normalized.push(channel);
    }
  }
  if (normalized.length === 0) {
    throw new BadRequestException('supportedChannels must contain at least one channel');
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
  if (!flowTemplate || typeof flowTemplate !== 'object' || Array.isArray(flowTemplate)) {
    throw new BadRequestException('flowTemplate must be a non-array object');
  }
  const conversationFlow = flowTemplate.conversationFlow;
  if (
    !conversationFlow ||
    typeof conversationFlow !== 'object' ||
    Array.isArray(conversationFlow)
  ) {
    throw new BadRequestException('flowTemplate.conversationFlow is required');
  }
  const conversationFlowRecord = conversationFlow as Record<string, unknown>;
  if (!Array.isArray(conversationFlowRecord.nodes)) {
    throw new BadRequestException('flowTemplate.conversationFlow.nodes must be an array');
  }
  if (conversationFlowRecord.nodes.length === 0) {
    throw new BadRequestException('flowTemplate.conversationFlow.nodes must not be empty');
  }
  if (
    conversationFlowRecord.start_speaker != null &&
    typeof conversationFlowRecord.start_speaker !== 'string'
  ) {
    throw new BadRequestException('flowTemplate.conversationFlow.start_speaker must be a string');
  }

  if (channels.includes('voice')) {
    const voiceId = flowTemplate.voice_id;
    if (typeof voiceId !== 'string' || voiceId.trim().length === 0) {
      throw new BadRequestException('flowTemplate.voice_id is required for voice channel');
    }
  }
}

import { BadRequestException } from '@nestjs/common';
import {
  normalizeSupportedChannels,
  selectDefaultChannel,
  validateFlowTemplateForChannels,
} from './flow-template.validator';

describe('flow-template.validator', () => {
  describe('normalizeSupportedChannels', () => {
    it('deduplicates channels while preserving first-seen order', () => {
      expect(
        normalizeSupportedChannels(['voice', 'chat', 'voice', 'email']),
      ).toEqual(['voice', 'chat', 'email']);
    });

    it('throws for invalid channels', () => {
      expect(() => normalizeSupportedChannels(['voice', 'sms'])).toThrow(
        BadRequestException,
      );
    });
  });

  describe('selectDefaultChannel', () => {
    it('prefers chat over voice and email', () => {
      expect(selectDefaultChannel(['voice', 'chat'])).toBe('chat');
    });
  });

  describe('validateFlowTemplateForChannels', () => {
    it('accepts non-conversation flow when response_engine.type exists', () => {
      expect(() =>
        validateFlowTemplateForChannels(
          { response_engine: { type: 'retell-llm' } },
          ['chat'],
        ),
      ).not.toThrow();
    });

    it('requires voice_id when voice channel is enabled', () => {
      expect(() =>
        validateFlowTemplateForChannels(
          { response_engine: { type: 'retell-llm' } },
          ['voice'],
        ),
      ).toThrow(BadRequestException);
    });

    it('requires nodes/tools for conversation-flow templates', () => {
      expect(() =>
        validateFlowTemplateForChannels(
          {
            response_engine: { type: 'conversation-flow' },
            conversationFlow: { nodes: [], tools: [] },
            voice_id: 'voice_123',
          },
          ['voice'],
        ),
      ).toThrow(BadRequestException);
    });
  });
});


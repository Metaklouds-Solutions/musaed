import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for sending a chat message to an agent conversation.
 * Matches Retell API: single user message content.
 */
export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64_000)
  content: string;
}

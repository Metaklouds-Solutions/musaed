import { IsIn, IsObject, IsOptional } from 'class-validator';

/**
 * Starts a tenant-scoped conversation against an active deployed channel.
 */
export class StartConversationDto {
  @IsIn(['chat', 'voice'])
  channel: 'chat' | 'voice';

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

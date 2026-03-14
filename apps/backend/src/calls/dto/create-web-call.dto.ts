import { IsMongoId } from 'class-validator';

/**
 * DTO for creating a web call via Retell.
 */
export class CreateWebCallDto {
  @IsMongoId()
  agentInstanceId: string;
}

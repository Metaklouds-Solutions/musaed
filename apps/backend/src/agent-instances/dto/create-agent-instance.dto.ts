import { ArrayNotEmpty, IsArray, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

/**
 * Creates a tenant-specific agent instance from a template.
 */
export class CreateAgentInstanceDto {
  @IsMongoId()
  templateId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['voice', 'chat', 'email'], { each: true })
  channelsEnabled: string[];

  @IsString()
  @IsOptional()
  capabilityLevel?: string;
}

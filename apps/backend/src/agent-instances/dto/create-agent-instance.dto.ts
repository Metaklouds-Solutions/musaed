import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Creates a tenant-specific agent instance from a template.
 */
export class CreateAgentInstanceDto {
  @IsMongoId()
  templateId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['voice', 'chat', 'email'], { each: true })
  channelsEnabled: string[];

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @IsIn(['basic', 'standard', 'advanced', 'enterprise'])
  capabilityLevel?: string;
}

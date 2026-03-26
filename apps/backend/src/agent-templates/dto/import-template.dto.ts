import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  MaxLength,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Imports a Retell flow template into the platform catalog.
 */
export class ImportTemplateDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(50)
  @IsIn([
    'basic',
    'standard',
    'advanced',
    'enterprise',
    'L1',
    'L2',
    'L3',
    'L4',
  ])
  capabilityLevel?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['voice', 'chat', 'email'], { each: true })
  supportedChannels: string[];

  @IsObject()
  flowTemplate: Record<string, unknown>;

  @IsString()
  @IsOptional()
  flowName?: string;
}

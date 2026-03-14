import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

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

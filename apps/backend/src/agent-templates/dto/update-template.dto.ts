import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsIn,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTemplateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsIn(['voice', 'chat', 'email'])
  @IsOptional()
  channel?: string;

  @IsArray()
  @IsIn(['voice', 'chat', 'email'], { each: true })
  @IsOptional()
  supportedChannels?: string[];

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

  @IsObject()
  @IsOptional()
  flowTemplate?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  voiceConfig?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  chatConfig?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  emailConfig?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  llmConfig?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  basePrompt?: string;

  @IsOptional()
  @IsUrl({}, { message: 'webhookUrl must be a valid URL' })
  @MaxLength(2000)
  webhookUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'mcpServerUrl must be a valid URL' })
  @MaxLength(2000)
  mcpServerUrl?: string;

  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

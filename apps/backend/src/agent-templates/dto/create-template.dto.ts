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

export class CreateTemplateDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsIn(['voice', 'chat', 'email'])
  channel: string;

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

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsIn,
} from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
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
  basePrompt?: string;

  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @IsString()
  @IsOptional()
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

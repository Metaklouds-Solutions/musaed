import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class RetellWebhookDto {
  @IsString()
  event: string;

  @IsString()
  @IsOptional()
  call_id?: string;

  @IsString()
  @IsOptional()
  agent_id?: string;

  @IsNumber()
  @IsOptional()
  duration_ms?: number;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  sentiment?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

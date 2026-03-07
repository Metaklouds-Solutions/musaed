import { IsOptional, IsObject, IsString, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  notifications?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  featureFlags?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  locations?: Record<string, unknown>[];

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  locale?: string;
}

import { IsOptional, IsObject, IsString, IsArray, Allow } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @Allow()
  businessHours?: Record<string, unknown> | string;

  @IsObject()
  @IsOptional()
  notifications?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  featureFlags?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  locations?: Record<string, unknown>[];

  @IsObject()
  @IsOptional()
  appointmentReminders?: { advanceMinutes?: number; channel?: string };

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  locale?: string;
}

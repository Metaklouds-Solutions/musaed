import { IsOptional, IsObject, IsString, IsArray, Allow, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

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

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsOptional()
  @MaxLength(20)
  locale?: string;
}

import { IsString, IsOptional, IsObject, IsMongoId, IsIn, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTenantDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ONBOARDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED'])
  status?: string;

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

  @IsMongoId()
  @IsOptional()
  planId?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}

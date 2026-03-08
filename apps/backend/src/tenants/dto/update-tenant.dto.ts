import { IsString, IsOptional, IsObject, IsMongoId, IsIn } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED'])
  status?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsMongoId()
  @IsOptional()
  planId?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}

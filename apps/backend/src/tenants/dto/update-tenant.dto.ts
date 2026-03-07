import { IsString, IsOptional, IsObject, IsMongoId } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

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

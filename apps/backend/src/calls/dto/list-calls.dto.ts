import { IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

export class ListCallsDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  @IsIn(['unknown', 'booked', 'escalated', 'failed', 'info_only'])
  outcome?: string;

  @IsOptional()
  @IsMongoId()
  agentId?: string;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

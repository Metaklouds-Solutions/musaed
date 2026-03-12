import { IsISO8601, IsIn, IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

/**
 * Query DTO for listing call sessions with pagination, date range, and filters.
 */
export class ListCallsDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(['unknown', 'booked', 'escalated', 'failed', 'info_only'])
  outcome?: string;

  @IsOptional()
  @IsMongoId()
  agentId?: string;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsOptional()
  @Matches(/^\d+$/, { message: 'page must be a numeric string' })
  page?: string;

  @IsOptional()
  @Matches(/^\d+$/, { message: 'limit must be a numeric string' })
  limit?: string;
}

import { IsISO8601, IsMongoId, IsOptional } from 'class-validator';

/**
 * Query DTO for calls analytics endpoints.
 * Supports optional filters: from, to, agentId, tenantId (admin only).
 */
export class AnalyticsCallsDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsMongoId()
  agentId?: string;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;
}

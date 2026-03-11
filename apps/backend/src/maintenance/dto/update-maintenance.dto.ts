import { IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';

/**
 * DTO for PATCH /admin/maintenance.
 */
export class UpdateMaintenanceDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

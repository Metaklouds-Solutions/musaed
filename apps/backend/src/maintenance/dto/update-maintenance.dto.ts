import { IsOptional, IsBoolean, IsString } from 'class-validator';

/**
 * DTO for PATCH /admin/maintenance.
 */
export class UpdateMaintenanceDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  message?: string;
}

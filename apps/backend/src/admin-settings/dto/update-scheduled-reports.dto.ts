import { IsOptional, IsBoolean, IsString, IsArray, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO for PATCH /admin/settings/scheduled-reports.
 */
export class UpdateScheduledReportsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;
}

import {
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsIn,
  IsEmail,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

/**
 * DTO for PATCH /admin/settings/scheduled-reports.
 */
export class UpdateScheduledReportsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsIn(['daily', 'weekly', 'monthly'])
  @IsOptional()
  frequency?: 'daily' | 'weekly' | 'monthly';

  @IsArray()
  @IsEmail({}, { each: true, message: 'Each recipient must be a valid email address' })
  @ArrayMaxSize(50)
  @IsOptional()
  recipients?: string[];

  @IsNumber()
  @Min(0)
  @Max(6)
  @IsOptional()
  dayOfWeek?: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  @IsOptional()
  dayOfMonth?: number;
}

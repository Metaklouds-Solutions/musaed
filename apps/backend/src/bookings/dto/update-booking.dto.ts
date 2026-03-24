import {
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookingDto {
  @IsIn(['confirmed', 'cancelled', 'completed', 'no_show'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  timeSlot?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(480)
  @IsOptional()
  durationMinutes?: number;
}

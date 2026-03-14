import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsNumber,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @IsMongoId()
  customerId: string;

  @IsMongoId()
  @IsOptional()
  providerId?: string;

  @IsMongoId()
  @IsOptional()
  locationId?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  serviceType: string;

  @IsDateString()
  date: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'timeSlot must be in HH:mm format' })
  timeSlot: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsIn(['confirmed', 'cancelled', 'completed', 'no_show'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  customerId: string;

  @IsMongoId()
  @IsOptional()
  providerId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  serviceType: string;

  @IsDateString()
  date: string;

  @IsString()
  timeSlot: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsIn(['confirmed', 'cancelled', 'completed', 'no_show'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

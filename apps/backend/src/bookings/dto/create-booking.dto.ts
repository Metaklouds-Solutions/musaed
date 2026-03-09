import {
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsNumber,
  IsIn,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  customerId: string;

  @IsMongoId()
  @IsOptional()
  providerId?: string;

  @IsMongoId()
  @IsOptional()
  locationId?: string;

  @IsString()
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
  notes?: string;
}

import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class UpdateBookingDto {
  @IsIn(['confirmed', 'cancelled', 'completed', 'no_show'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

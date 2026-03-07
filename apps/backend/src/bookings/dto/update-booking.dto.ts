import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateBookingDto {
  @IsIn(['confirmed', 'cancelled', 'completed', 'no_show'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

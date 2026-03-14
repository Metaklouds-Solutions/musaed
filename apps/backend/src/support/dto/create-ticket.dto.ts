import {
  IsString,
  IsIn,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTicketDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(300)
  title: string;

  @IsIn(['billing', 'technical', 'agent', 'general'])
  category: string;

  @IsIn(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(5000)
  body?: string;
}

import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsObject,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(200)
  name: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsIn(['call', 'chat', 'email', 'manual'])
  @IsOptional()
  source?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

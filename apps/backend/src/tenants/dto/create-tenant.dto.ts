import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTenantDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase alphanumeric with hyphens only',
  })
  slug: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  ownerEmail: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(200)
  ownerName?: string;

  @IsMongoId()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['voice', 'chat', 'email'], { each: true })
  @IsOptional()
  channelsEnabled?: string[];
}

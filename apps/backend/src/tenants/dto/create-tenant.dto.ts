import { IsString, IsOptional, IsEmail, IsMongoId, Matches, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens only' })
  slug: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsMongoId()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

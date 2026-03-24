import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Body for admin-only SMTP test send (requires ENABLE_TEST_EMAIL=true).
 */
export class SendTestEmailDto {
  @IsOptional()
  @IsEmail()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;
}

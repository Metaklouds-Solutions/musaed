import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class SetupPasswordDto {
  @IsString()
  @MaxLength(256)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}

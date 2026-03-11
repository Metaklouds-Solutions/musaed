import { IsEmail, IsString, IsIn, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class InviteStaffDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(200)
  name: string;

  @IsIn(['tenant_owner', 'clinic_admin', 'doctor', 'receptionist', 'auditor', 'tenant_staff'])
  roleSlug: string;
}

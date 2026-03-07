import { IsEmail, IsString, IsIn } from 'class-validator';

export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsIn(['tenant_owner', 'clinic_admin', 'doctor', 'receptionist', 'auditor', 'tenant_staff'])
  roleSlug: string;
}

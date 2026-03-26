import { IsOptional, IsIn } from 'class-validator';

export class UpdateStaffDto {
  @IsIn([
    'tenant_owner',
    'clinic_admin',
    'doctor',
    'receptionist',
    'auditor',
    'tenant_staff',
  ])
  @IsOptional()
  roleSlug?: string;

  @IsIn(['active', 'invited', 'disabled'])
  @IsOptional()
  status?: string;
}

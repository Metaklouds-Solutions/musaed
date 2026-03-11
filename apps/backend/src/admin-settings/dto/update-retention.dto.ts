import {
  IsOptional, IsString, IsBoolean, IsNumber,
  IsArray, ValidateNested, Min,
  ValidatorConstraint, ValidatorConstraintInterface, Validate,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

class RetentionPolicyDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  days: number;

  @IsBoolean()
  enabled: boolean;
}

@ValidatorConstraint({ name: 'requireIdOrPolicies', async: false })
class RequireIdOrPolicies implements ValidatorConstraintInterface {
  validate(_: unknown, args?: ValidationArguments): boolean {
    const obj = args?.object as Record<string, unknown> | undefined;
    if (!obj) return false;
    return typeof obj['id'] === 'string' || Array.isArray(obj['policies']);
  }

  defaultMessage(): string {
    return 'Either "id" (to update a single policy) or "policies" (to replace all) must be provided.';
  }
}

/**
 * DTO for PATCH /admin/settings/retention.
 * Either update a single policy (by id) or replace all policies.
 * An empty body is rejected — at least one action path is required.
 */
export class UpdateRetentionDto {
  @Validate(RequireIdOrPolicies)
  private readonly _validate?: undefined;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetentionPolicyDto)
  policies?: RetentionPolicyDto[];
}

import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

class RetentionPolicyDto {
  @IsString()
  @MaxLength(100)
  id: string;

  @IsString()
  @MaxLength(200)
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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  id?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  days?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetentionPolicyDto)
  @IsOptional()
  policies?: RetentionPolicyDto[];
}

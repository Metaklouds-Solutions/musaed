import { IsArray, IsString, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IntegrationItemDto {
  @IsString()
  @MaxLength(100)
  id: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(50)
  status: string;

  @IsOptional()
  config?: Record<string, string>;
}

/**
 * DTO for PATCH /admin/settings/integrations.
 */
export class UpdateIntegrationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegrationItemDto)
  integrations: IntegrationItemDto[];
}

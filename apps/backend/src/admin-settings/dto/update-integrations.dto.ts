import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IntegrationItemDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
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

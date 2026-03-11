import { IsString, IsOptional, IsObject, IsIn, IsMongoId, MaxLength } from 'class-validator';

/**
 * DTO for creating a notification for a specific user.
 */
export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsMongoId()
  tenantId?: string;

  @IsString()
  @MaxLength(50)
  type: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['critical', 'high', 'normal', 'low'])
  priority?: 'critical' | 'high' | 'normal' | 'low';
}

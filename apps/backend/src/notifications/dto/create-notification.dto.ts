import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  tenantId?: string | null;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['critical', 'high', 'normal', 'low'])
  priority?: string;
}

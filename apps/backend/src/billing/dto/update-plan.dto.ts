import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyPriceCents?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  maxVoiceAgents?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  maxChatAgents?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  maxEmailAgents?: number;

  @IsNumber()
  @Min(-1)
  @IsOptional()
  maxStaff?: number;

  @IsString()
  @IsOptional()
  stripeProductId?: string;

  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @IsObject()
  @IsOptional()
  features?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

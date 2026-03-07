import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  monthlyPriceCents: number;

  @IsNumber()
  @Min(-1)
  maxVoiceAgents: number;

  @IsNumber()
  @Min(-1)
  maxChatAgents: number;

  @IsNumber()
  @Min(-1)
  maxEmailAgents: number;

  @IsNumber()
  @Min(-1)
  maxStaff: number;

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

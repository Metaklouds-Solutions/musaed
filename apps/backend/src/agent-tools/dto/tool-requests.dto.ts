import {
  IsEmail,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AgentIdDto {
  @IsMongoId()
  agent_id: string;
}

export class PastTicketsDto extends AgentIdDto {
  @IsEmail()
  user_email: string;

  @IsInt()
  @Min(1)
  @Max(7 * 24 * 60)
  @IsOptional()
  minutes_threshold?: number;
}

export class CreateTicketDto extends AgentIdDto {
  @IsEmail()
  user_email: string;

  @IsString()
  subject: string;

  @IsString()
  problem: string;
}

export class LeadDto extends AgentIdDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class AvailableSlotsDto extends AgentIdDto {
  @IsString()
  preferred_date: string;

  @IsString()
  preferred_time_window: string;

  @IsString()
  timezone: string;
}

export class BookMeetingDto extends AgentIdDto {
  @IsEmail()
  email: string;

  @IsString()
  confirmed_slot: string;

  @IsString()
  timezone: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  meeting_type?: string;

  @IsString()
  @IsOptional()
  call_id?: string;
}

export class ResendInviteDto extends AgentIdDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  meeting_id?: string;
}

export class InvokeSkillDto extends AgentIdDto {
  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;
}

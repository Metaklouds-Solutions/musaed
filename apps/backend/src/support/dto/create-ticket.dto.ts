import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  title: string;

  @IsIn(['billing', 'technical', 'agent', 'general'])
  category: string;

  @IsIn(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  body?: string;
}

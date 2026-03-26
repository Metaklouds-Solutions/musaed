import { IsString, IsIn } from 'class-validator';

/**
 * DTO for updating a support ticket's status.
 */
export class UpdateTicketStatusDto {
  @IsString()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status: string;
}

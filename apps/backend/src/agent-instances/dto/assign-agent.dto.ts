import { IsMongoId } from 'class-validator';

/**
 * Assigns an existing agent instance to a tenant.
 */
export class AssignAgentDto {
  @IsMongoId()
  tenantId: string;
}

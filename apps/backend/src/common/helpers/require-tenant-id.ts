import { BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Extracts and validates the tenant ID from an authenticated request.
 * Throws a 400 BadRequestException if the tenant context is missing.
 *
 * @param req - The authenticated request containing optional tenantId
 * @returns The tenant ID string, guaranteed non-null
 * @throws {BadRequestException} When tenant context is absent
 */
export function requireTenantId(req: AuthenticatedRequest): string {
  const { tenantId } = req;
  if (!tenantId) {
    throw new BadRequestException('Tenant context is required');
  }
  return tenantId;
}

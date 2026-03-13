import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { AvailabilityService } from './availability.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { requireTenantId } from '../common/helpers/require-tenant-id';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

@Controller('tenant/availability')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.AVAILABILITY_READ)
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  async getSlots(
    @Request() req: AuthenticatedRequest,
    @Query('start') startParam?: string,
    @Query('end') endParam?: string,
  ) {
    const tenantId = requireTenantId(req);
    const start = startParam ? new Date(startParam) : new Date();
    const end = endParam
      ? new Date(endParam)
      : new Date(Date.now() + TWO_WEEKS_MS);

    return this.availabilityService.getAvailabilitySlots(tenantId, start, end);
  }
}

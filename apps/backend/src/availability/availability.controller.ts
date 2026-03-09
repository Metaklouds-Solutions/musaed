import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AvailabilityService } from './availability.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('tenant/availability')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  async getSlots(
    @Request() req: AuthenticatedRequest,
    @Query('start') startParam?: string,
    @Query('end') endParam?: string,
  ) {
    const tenantId = req.tenantId;
    if (!tenantId) return [];

    const start = startParam ? new Date(startParam) : new Date();
    const end = endParam ? new Date(endParam) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return this.availabilityService.getAvailabilitySlots(tenantId, start, end);
  }
}

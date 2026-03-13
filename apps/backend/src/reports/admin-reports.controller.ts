import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('tenant-comparison')
  getTenantComparison(
    @Query('tenantIds') tenantIdsParam?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantIds = tenantIdsParam
      ? tenantIdsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return this.reportsService.getTenantComparison(tenantIds, dateFrom, dateTo);
  }
}

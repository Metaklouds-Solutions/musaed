import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { ReportsService } from './reports.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { requireTenantId } from '../common/helpers/require-tenant-id';

@Controller('tenant/reports')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.REPORTS_READ)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('performance')
  getPerformance(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getPerformance(tenantId, dateFrom, dateTo);
  }

  @Get('outcomes-by-day')
  getOutcomesByDay(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getOutcomesByDay(tenantId, dateFrom, dateTo);
  }

  @Get('outcomes-by-version')
  getOutcomesByVersion(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getOutcomesByVersion(tenantId, dateFrom, dateTo);
  }

  @Get('performance-for-period')
  getPerformanceForPeriod(
    @Request() req: AuthenticatedRequest,
    @Query('period') period?: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth',
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getPerformanceForPeriod(tenantId, period ?? 'thisWeek');
  }

  @Get('sentiment-distribution')
  getSentimentDistribution(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getSentimentDistribution(tenantId, dateFrom, dateTo);
  }

  @Get('peak-hours')
  getPeakHours(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getPeakHours(tenantId, dateFrom, dateTo);
  }

  @Get('intent-distribution')
  getIntentDistribution(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.reportsService.getIntentDistribution(tenantId, dateFrom, dateTo);
  }
}

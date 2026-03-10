import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ReportsService } from './reports.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('tenant/reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('performance')
  getPerformance(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getPerformance(req.tenantId!, dateFrom, dateTo);
  }

  @Get('outcomes-by-day')
  getOutcomesByDay(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getOutcomesByDay(req.tenantId!, dateFrom, dateTo);
  }

  @Get('outcomes-by-version')
  getOutcomesByVersion(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getOutcomesByVersion(req.tenantId!, dateFrom, dateTo);
  }

  @Get('performance-for-period')
  getPerformanceForPeriod(
    @Request() req: AuthenticatedRequest,
    @Query('period') period?: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth',
  ) {
    return this.reportsService.getPerformanceForPeriod(req.tenantId!, period ?? 'thisWeek');
  }

  @Get('sentiment-distribution')
  getSentimentDistribution(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getSentimentDistribution(req.tenantId!, dateFrom, dateTo);
  }

  @Get('peak-hours')
  getPeakHours(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getPeakHours(req.tenantId!, dateFrom, dateTo);
  }

  @Get('intent-distribution')
  getIntentDistribution(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getIntentDistribution(req.tenantId!, dateFrom, dateTo);
  }
}

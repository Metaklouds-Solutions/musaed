import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { DashboardService } from './dashboard.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';

@Controller('tenant/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getTenantMetrics(req.tenantId!);
  }

  @Get('funnel')
  getFunnel(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.dashboardService.getFunnel(req.tenantId!, dateFrom, dateTo);
  }

  @Get('trend')
  getTrend(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.dashboardService.getTrend(req.tenantId!, dateFrom, dateTo);
  }

  @Get('roi')
  getRoiMetrics(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.dashboardService.getRoiMetrics(req.tenantId!, dateFrom, dateTo);
  }

  @Get('agent-status')
  getTenantAgentStatus(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getTenantAgentStatus(req.tenantId!);
  }

  @Get('recent-calls')
  getTenantRecentCalls(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { limit: limitNum } = parsePagination({ limit }, { limit: 10 });
    return this.dashboardService.getTenantRecentCalls(
      req.tenantId!,
      limitNum,
      dateFrom,
      dateTo,
    );
  }
}

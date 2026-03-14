import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { DashboardService } from './dashboard.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';
import { requireTenantId } from '../common/helpers/require-tenant-id';

@Controller('tenant/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.DASHBOARD_READ)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(@Request() req: AuthenticatedRequest) {
    const tenantId = requireTenantId(req);
    return this.dashboardService.getTenantMetrics(tenantId);
  }

  @Get('summary')
  getSummary(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.dashboardService.getTenantSummary(tenantId, dateFrom, dateTo);
  }

  @Get('funnel')
  getFunnel(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.dashboardService.getFunnel(tenantId, dateFrom, dateTo);
  }

  @Get('trend')
  getTrend(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.dashboardService.getTrend(tenantId, dateFrom, dateTo);
  }

  @Get('roi')
  getRoiMetrics(
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.dashboardService.getRoiMetrics(tenantId, dateFrom, dateTo);
  }

  @Get('agent-status')
  getTenantAgentStatus(@Request() req: AuthenticatedRequest) {
    const tenantId = requireTenantId(req);
    return this.dashboardService.getTenantAgentStatus(tenantId);
  }

  @Get('recent-calls')
  getTenantRecentCalls(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = requireTenantId(req);
    const { limit: limitNum } = parsePagination({ limit }, { limit: 10 });
    return this.dashboardService.getTenantRecentCalls(
      tenantId,
      limitNum,
      dateFrom,
      dateTo,
    );
  }
}

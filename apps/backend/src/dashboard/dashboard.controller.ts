import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { DashboardService } from './dashboard.service';

@Controller('tenant/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(@Request() req: any) {
    return this.dashboardService.getTenantMetrics(req.tenantId);
  }
}

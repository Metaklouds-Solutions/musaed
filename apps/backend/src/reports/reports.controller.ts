import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ReportsService } from './reports.service';

@Controller('tenant/reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('performance')
  getPerformance(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getPerformance(req.tenantId, dateFrom, dateTo);
  }
}

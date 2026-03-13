import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getSystemOverview();
  }

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('system')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}

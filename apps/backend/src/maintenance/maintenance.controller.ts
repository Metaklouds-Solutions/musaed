import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { MaintenanceService } from './maintenance.service';

@Controller()
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get('maintenance/status')
  getStatus() {
    return this.maintenanceService.getStatus();
  }

  @Patch('admin/maintenance')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setStatus(@Body() body: { enabled?: boolean; message?: string }) {
    const current = await this.maintenanceService.getStatus();
    const enabled = body.enabled ?? current.enabled;
    const message = body.message ?? current.message;
    return this.maintenanceService.setStatus(enabled, message);
  }
}

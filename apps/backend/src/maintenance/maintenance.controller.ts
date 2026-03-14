import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { MaintenanceService } from './maintenance.service';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Controller()
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get('maintenance/status')
  getStatus() {
    return this.maintenanceService.getStatus();
  }

  @Patch('admin/maintenance')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setStatus(@Body() dto: UpdateMaintenanceDto) {
    const current = await this.maintenanceService.getStatus();
    const enabled = dto.enabled ?? current.enabled;
    const message = dto.message ?? current.message;
    return this.maintenanceService.setStatus(enabled, message);
  }
}

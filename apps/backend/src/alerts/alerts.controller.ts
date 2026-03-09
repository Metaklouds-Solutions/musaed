import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AlertsService } from './alerts.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
@Controller('tenant/alerts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  getAlerts(@Request() req: AuthenticatedRequest) {
    const tenantId = req.tenantId;
    if (!tenantId) return [];
    return this.alertsService.getAlerts(tenantId);
  }

  @Patch(':id/resolve')
  async resolveAlert(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.tenantId;
    if (!tenantId) return { ok: false };
    const ok = await this.alertsService.resolveAlert(tenantId, id);
    return { ok };
  }
}

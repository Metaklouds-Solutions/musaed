import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { AlertsService } from './alerts.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { requireTenantId } from '../common/helpers/require-tenant-id';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('tenant/alerts')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ALERTS_READ)
  getAlerts(@Request() req: AuthenticatedRequest) {
    const tenantId = requireTenantId(req);
    return this.alertsService.getAlerts(tenantId);
  }

  @Patch(':id/resolve')
  @RequirePermissions(PERMISSIONS.ALERTS_WRITE)
  async resolveAlert(@Request() req: AuthenticatedRequest, @Param('id', ParseObjectIdPipe) id: string) {
    const tenantId = requireTenantId(req);
    const ok = await this.alertsService.resolveAlert(tenantId, id);
    return { ok };
  }
}

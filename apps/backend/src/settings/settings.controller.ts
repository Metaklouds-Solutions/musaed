import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('tenant/settings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings(@Request() req: AuthenticatedRequest) {
    return this.settingsService.getSettings(req.tenantId!);
  }

  @Patch()
  updateSettings(@Request() req: AuthenticatedRequest, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(req.tenantId!, dto);
  }
}

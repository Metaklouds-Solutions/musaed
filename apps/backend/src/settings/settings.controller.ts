import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { requireTenantId } from '../common/helpers/require-tenant-id';

@Controller('tenant/settings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings(@Request() req: AuthenticatedRequest) {
    const tenantId = requireTenantId(req);
    return this.settingsService.getSettings(tenantId);
  }

  @Patch()
  updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.settingsService.updateSettings(tenantId, dto);
  }
}

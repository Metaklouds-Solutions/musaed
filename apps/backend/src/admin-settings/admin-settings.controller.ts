import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateRetentionDto } from './dto/update-retention.dto';
import { UpdateIntegrationsDto } from './dto/update-integrations.dto';
import { UpdateScheduledReportsDto } from './dto/update-scheduled-reports.dto';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(private adminSettingsService: AdminSettingsService) {}

  @Get()
  async getSettings() {
    return this.adminSettingsService.getFullSettings();
  }

  @Get('retention')
  async getRetention() {
    return this.adminSettingsService.getRetentionPolicies();
  }

  @Patch('retention')
  async updateRetention(@Body() dto: UpdateRetentionDto) {
    if (dto.policies?.length) {
      await this.adminSettingsService.setRetentionPolicies(dto.policies);
    } else if (dto.id) {
      await this.adminSettingsService.updateRetentionPolicy(dto.id, {
        enabled: dto.enabled,
        days: dto.days,
      });
    } else {
      throw new BadRequestException(
        'Either "id" or "policies" must be provided.',
      );
    }
    return this.adminSettingsService.getRetentionPolicies();
  }

  @Get('integrations')
  async getIntegrations() {
    return this.adminSettingsService.getIntegrations();
  }

  @Patch('integrations')
  async updateIntegrations(@Body() dto: UpdateIntegrationsDto) {
    if (dto.integrations) {
      await this.adminSettingsService.updateIntegrations(dto.integrations);
    }
    return this.adminSettingsService.getIntegrations();
  }

  @Get('scheduled-reports')
  async getScheduledReports() {
    return this.adminSettingsService.getScheduledReportConfig();
  }

  @Patch('scheduled-reports')
  async updateScheduledReports(@Body() dto: UpdateScheduledReportsDto) {
    await this.adminSettingsService.setScheduledReportConfig(dto);
    return this.adminSettingsService.getScheduledReportConfig();
  }
}

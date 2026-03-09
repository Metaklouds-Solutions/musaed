import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminSettingsService } from './admin-settings.service';

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
  async updateRetention(
    @Body() body: { id?: string; enabled?: boolean; days?: number; policies?: { id: string; name: string; days: number; enabled: boolean }[] },
  ) {
    if (body.policies?.length) {
      await this.adminSettingsService.setRetentionPolicies(body.policies);
    } else if (body.id) {
      await this.adminSettingsService.updateRetentionPolicy(body.id, {
        enabled: body.enabled,
        days: body.days,
      });
    }
    return this.adminSettingsService.getRetentionPolicies();
  }

  @Get('integrations')
  async getIntegrations() {
    return this.adminSettingsService.getIntegrations();
  }

  @Patch('integrations')
  async updateIntegrations(@Body() body: { integrations: { id: string; name: string; status: string; config?: Record<string, string> }[] }) {
    if (body.integrations) {
      await this.adminSettingsService.updateIntegrations(body.integrations);
    }
    return this.adminSettingsService.getIntegrations();
  }

  @Get('scheduled-reports')
  async getScheduledReports() {
    return this.adminSettingsService.getScheduledReportConfig();
  }

  @Patch('scheduled-reports')
  async updateScheduledReports(
    @Body() body: { enabled?: boolean; frequency?: string; recipients?: string[]; dayOfWeek?: number; dayOfMonth?: number },
  ) {
    await this.adminSettingsService.setScheduledReportConfig(body);
    return this.adminSettingsService.getScheduledReportConfig();
  }
}

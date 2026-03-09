import { Controller, Get, UseGuards, Request, Res, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ExportService } from './export.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('tenant/export')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ExportTenantController {
  constructor(private exportService: ExportService) {}

  @Get('staff')
  async exportStaff(@Request() req: AuthenticatedRequest, @Res() res: Response) {
    const tenantId = req.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const csv = await this.exportService.exportStaffCsv(tenantId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="staff-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  @Get('tickets')
  async exportTickets(@Request() req: AuthenticatedRequest, @Res() res: Response) {
    const tenantId = req.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const csv = await this.exportService.exportTicketsCsv(tenantId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }
}

@Controller('admin/export')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ExportAdminController {
  constructor(private exportService: ExportService) {}

  @Get('tenants')
  async exportTenants(@Res() res: Response) {
    const csv = await this.exportService.exportTenantsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tenants-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }
}

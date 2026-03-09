import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AuditService } from './audit.service';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  getRecent(
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.auditService.getRecent(
      limit ? parseInt(limit, 10) : 100,
      tenantId,
    );
  }
}

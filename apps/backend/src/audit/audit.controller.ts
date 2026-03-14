import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AuditService } from './audit.service';
import { parsePagination } from '../common/helpers/parse-pagination';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  getRecent(
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const { limit: l } = parsePagination({ limit }, { limit: 100 });
    return this.auditService.getRecent(l, tenantId);
  }
}

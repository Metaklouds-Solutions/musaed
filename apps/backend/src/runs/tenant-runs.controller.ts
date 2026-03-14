import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { requireTenantId } from '../common/helpers/require-tenant-id';
import { parsePagination } from '../common/helpers/parse-pagination';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { RunsService } from './runs.service';

/**
 * Tenant-scoped runs controller. Allows tenant users to view their own runs
 * and admins to view a specific tenant's runs (via ?tenantId= query).
 */
@Controller('tenant/runs')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantRunsController {
  constructor(private readonly runsService: RunsService) {}

  /**
   * List runs for the current tenant context.
   */
  @Get()
  list(
    @Request() req: AuthenticatedRequest,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const tenantId = requireTenantId(req);
    const { page, limit } = parsePagination({ page: pageStr, limit: limitStr });
    return this.runsService.listRuns(page, limit, tenantId);
  }

  /**
   * Get a run by Retell call ID for the current tenant.
   */
  @Get('by-call/:callId')
  async getRunByCallId(
    @Request() req: AuthenticatedRequest,
    @Param('callId') callId: string,
  ) {
    const tenantId = requireTenantId(req);
    const run = await this.runsService.getRunByCallId(callId, tenantId);
    if (!run) throw new NotFoundException('Run not found for this call');
    return run;
  }

  /**
   * Get events for a run. Verifies the run belongs to the tenant.
   */
  @Get(':id/events')
  getRunEvents(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.runsService.getRunEventsForTenant(id, tenantId);
  }
}

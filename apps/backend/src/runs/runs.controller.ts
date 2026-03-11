import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { RunsService } from './runs.service';
import { parsePagination } from '../common/helpers/parse-pagination';

@Controller('admin/runs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RunsController {
  constructor(private runsService: RunsService) {}

  /**
   * List all agent runs with optional tenant filter and pagination.
   */
  @Get()
  listRuns(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const { page, limit } = parsePagination({ page: pageStr, limit: limitStr });
    return this.runsService.listRuns(page, limit, tenantId || undefined);
  }

  /**
   * Get a run by call ID (for call detail auditor view).
   */
  @Get('by-call/:callId')
  async getRunByCallId(
    @Param('callId') callId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const run = await this.runsService.getRunByCallId(callId, tenantId || undefined);
    if (!run) throw new NotFoundException('Run not found for this call');
    return run;
  }

  /**
   * Get a single run by ID.
   */
  @Get(':id')
  async getRun(@Param('id', ParseObjectIdPipe) id: string) {
    const run = await this.runsService.getRun(id);
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  /**
   * Get events for a run.
   */
  @Get(':id/events')
  getRunEvents(@Param('id', ParseObjectIdPipe) id: string) {
    return this.runsService.getRunEvents(id);
  }
}
